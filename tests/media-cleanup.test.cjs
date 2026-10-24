const { test } = require("node:test");
const assert = require("node:assert/strict");
require("ts-node/register/transpile-only");
const config = require("../src/config/config").default;
config.cloudinary.cloudName = "test-media-cloud";
const media = require("../src/services/mediaCleanup.service");
const { v2: cloudinary } = require("cloudinary");
const mongoose = require("mongoose");
const url = (type, id) =>
  `https://res.cloudinary.com/test-media-cloud/${type}/upload/v123/${id}`;

test("Cloudinary identifiers preserve folders and raw extensions and reject unrelated hosts/clouds", () => {
  assert.equal(
    media.cloudAsset(url("image", "avatars/photo.jpg")).publicId,
    "avatars/photo",
  );
  assert.equal(
    media.cloudAsset(url("raw", "homework/answers.pdf")).publicId,
    "homework/answers.pdf",
  );
  assert.equal(
    media.cloudAsset(url("video", "help/demo.mp4")).resourceType,
    "video",
  );
  assert.equal(
    media.cloudAsset(
      "https://res.cloudinary.com/test-media-cloud/image/upload/c_fill,w_100/v123/folder/avatar.png",
    ).publicId,
    "folder/avatar",
  );
  for (const value of [
    "",
    "/images/logo.png",
    "https://example.com/a.jpg",
    "https://res.cloudinary.com/another-cloud/image/upload/v123/a.jpg",
  ])
    assert.equal(media.cloudAsset(value), null);
});

test("asset extraction handles object attachments, URL arrays, nested question/section images, duplicates and soft deletion", () => {
  const object = {
    avatar: {
      public_id: "avatars/photo",
      url: url("image", "avatars/photo.jpg"),
    },
  };
  assert.equal(media.recordAssets(object, ["avatar"]).length, 1);
  assert.equal(
    media.recordAssets(
      {
        img: [url("image", "a.jpg"), url("image", "a.jpg")],
        sections: [{ imageUrls: [url("image", "b.png")] }],
      },
      ["img", "sections.imageUrls"],
    ).length,
    2,
  );
  assert.equal(
    media.recordAssets(
      { isDeleted: true, file: [{ url: url("image", "a.jpg") }] },
      ["file"],
    ).length,
    0,
  );
});

test("Cloudinary destruction uses the stored resource type and invalidates delivery caches", async () => {
  const original = cloudinary.uploader.destroy;
  const calls = [];
  cloudinary.uploader.destroy = async (...args) => {
    calls.push(args);
    return { result: "ok" };
  };
  try {
    const destroy = require("../src/utils/cloudinary").deleteFromCloudinary;
    await destroy("work/file.pdf", "raw");
    assert.deepEqual(calls[0], [
      "work/file.pdf",
      { resource_type: "raw", type: "upload", invalidate: true },
    ]);
    cloudinary.uploader.destroy = async () => ({ result: "not found" });
    await destroy("gone", "image");
    cloudinary.uploader.destroy = async () => {
      throw Error("provider unavailable");
    };
    await assert.rejects(destroy("retry", "image"));
  } finally {
    cloudinary.uploader.destroy = original;
  }
});

test("shared files remain in Cloudinary; unreferenced files are deleted; provider failures remain retryable", async () => {
  const asset = media.cloudAsset(url("image", "profile.jpg"));
  let deletions = 0;
  assert.equal(
    await media.cleanAsset(
      asset,
      async () => true,
      async () => {
        deletions++;
      },
    ),
    false,
  );
  assert.equal(deletions, 0);
  assert.equal(
    await media.cleanAsset(
      asset,
      async () => false,
      async () => {
        deletions++;
      },
    ),
    true,
  );
  assert.equal(deletions, 1);
  await assert.rejects(
    media.cleanAsset(
      asset,
      async () => false,
      async () => {
        throw Error("offline");
      },
    ),
  );
});

test("all asset-bearing schemas have save/update/delete hooks and reference filters cast for their field types", async () => {
  for (const file of [
    "user.model",
    "school.model",
    "room.model",
    "lesson.model",
    "academicDocument.model",
    "homework.model",
    "teacherResource.model",
    "submission.model",
    "message.model",
    "groupWork.model",
    "quiz.model",
    "quizQA.model",
    "learningTip.model",
  ])
    require(`../src/models/${file}`);
  const originals = [];
  for (const name of Object.keys(media.mediaFields)) {
    const model = mongoose.models[name];
    assert.ok(model, name);
    for (const operation of [
      "save",
      "findOneAndUpdate",
      "findOneAndDelete",
      "deleteOne",
      "deleteMany",
    ]) {
      assert.ok(
        model.schema.s.hooks._pres.get(operation)?.length,
        `${name}.${operation}`,
      );
      assert.ok(
        model.schema.s.hooks._posts.get(operation)?.length,
        `${name}.${operation}`,
      );
    }
    originals.push([model, model.exists]);
    model.exists = async (filter) => {
      const query = model.findOne(filter);
      query.cast(model);
      return null;
    };
  }
  try {
    assert.equal(
      await media.assetIsReferenced(
        media.cloudAsset(url("image", "photo.jpg")),
      ),
      false,
    );
    const encoded = url("image", "folder/my%20photo.jpg");
    mongoose.models.LearningTip.exists = async (filter) =>
      filter.$or.some(
        (clause) =>
          clause.imageUrl instanceof RegExp && clause.imageUrl.test(encoded),
      )
        ? { _id: "shared-image" }
        : null;
    assert.equal(
      await media.assetIsReferenced(media.cloudAsset(encoded)),
      true,
    );
  } finally {
    for (const [model, original] of originals) model.exists = original;
  }
});

test("cleanup is staged before the database mutation and flushed only after success", async () => {
  const { User } = require("../src/models/user.model");
  const originalFind = User.find;
  const originalQueue = media.queueMediaCleanup;
  const originalProcess = media.processMediaCleanup;
  const order = [];
  User.find = () => ({
    select() {
      return this;
    },
    limit() {
      return this;
    },
    lean: async () => [{ avatar: { url: url("image", "old.jpg") } }],
  });
  media.queueMediaCleanup = async (assets) => {
    order.push("stage");
    assert.equal(assets[0].publicId, "old");
    return ["fixture"];
  };
  media.processMediaCleanup = async () => {
    order.push("destroy-after-write");
  };
  const query = User.findOneAndUpdate(
    { _id: "507f1f77bcf86cd799439011" },
    { avatar: { url: url("image", "new.jpg") } },
  );
  const hooks = User.schema.s.hooks;
  try {
    await new Promise((resolve, reject) =>
      hooks.execPre("findOneAndUpdate", query, (err) =>
        err ? reject(err) : resolve(),
      ),
    );
    assert.deepEqual(order, ["stage"]);
    order.push("database-commit");
    await new Promise((resolve, reject) =>
      hooks.execPost("findOneAndUpdate", query, [{}], {}, (err) =>
        err ? reject(err) : resolve(),
      ),
    );
    assert.deepEqual(order, [
      "stage",
      "database-commit",
      "stage",
      "destroy-after-write",
    ]);
    media.queueMediaCleanup = async () => {
      throw Error("queue unavailable");
    };
    const blocked = User.findOneAndUpdate(
      { _id: "507f1f77bcf86cd799439011" },
      { avatar: { url: url("image", "new.jpg") } },
    );
    await assert.rejects(
      new Promise((resolve, reject) =>
        hooks.execPre("findOneAndUpdate", blocked, (err) =>
          err ? reject(err) : resolve(),
        ),
      ),
      /queue unavailable/,
    );
  } finally {
    User.find = originalFind;
    media.queueMediaCleanup = originalQueue;
    media.processMediaCleanup = originalProcess;
  }
});

test("profile form saves teacher subjects/state/grade without allowing account status or role changes", async () => {
  const { User } = require("../src/models/user.model");
  const { updateUser } = require("../src/controllers/user.controller");
  const originals = [User.findById, User.findByIdAndUpdate];
  let updates;
  const actor = {
    _id: "507f1f77bcf86cd799439011",
    type: "teacher",
    role: "user",
    state: "active",
    subjects: [],
  };
  User.findById = () => ({ select: async () => actor });
  User.findByIdAndUpdate = (_id, data) => {
    updates = data;
    return { select: async () => ({ ...actor, ...data }) };
  };
  const invoke = async (body) => {
    let result;
    await updateUser(
      { params: { id: actor._id }, user: actor, body },
      {
        status() {
          return this;
        },
        json(value) {
          result = value;
        },
      },
      (err) => {
        throw err;
      },
    );
    return result;
  };
  try {
    const saved = await invoke({
      username: "Teacher",
      gradeLevel: "6",
      locationState: "Texas",
      subjects: '["Math","Science"]',
      state: "suspended",
      role: "admin",
      type: "parent",
    });
    assert.deepEqual(updates.subjects, ["Math", "Science"]);
    assert.equal(updates.gradeLevel, "6");
    assert.equal(updates.locationState, "Texas");
    assert.equal(updates.state, undefined);
    assert.equal(updates.role, undefined);
    assert.equal(saved.data.locationState, "Texas");
    await invoke({ removeAvatar: true });
    assert.deepEqual(updates.avatar, { public_id: "", url: "" });
    await assert.rejects(invoke({ subjects: "not-json" }));
  } finally {
    [User.findById, User.findByIdAndUpdate] = originals;
  }
});

test("a provider outage keeps the durable cleanup job and a later retry removes it", async () => {
  const { MediaCleanup } = require("../src/models/mediaCleanup.model");
  const originals = [
    MediaCleanup.findOneAndUpdate,
    MediaCleanup.updateOne,
    MediaCleanup.deleteOne,
    cloudinary.uploader.destroy,
  ];
  const references = Object.keys(media.mediaFields).map((name) => [
    mongoose.models[name],
    mongoose.models[name].exists,
  ]);
  for (const [model] of references) model.exists = async () => null;
  const asset = media.cloudAsset(url("image", "retry-avatar.jpg"));
  const key = media.assetKey(asset);
  let pending = true;
  let calls = 0;
  let postponed;
  MediaCleanup.findOneAndUpdate = async () =>
    pending ? { _id: key, attempts: 1, toObject: () => asset } : null;
  MediaCleanup.updateOne = async (_filter, update) => {
    postponed = update.$set.nextAttemptAt;
  };
  MediaCleanup.deleteOne = async () => {
    pending = false;
  };
  cloudinary.uploader.destroy = async () => {
    calls++;
    if (calls === 1) throw Error("provider unavailable");
    return { result: "ok" };
  };
  try {
    await media.processMediaCleanup([key]);
    assert.equal(pending, true);
    assert.ok(postponed > new Date());
    await media.processMediaCleanup([key]);
    assert.equal(pending, false);
    assert.equal(calls, 2);
  } finally {
    [
      MediaCleanup.findOneAndUpdate,
      MediaCleanup.updateOne,
      MediaCleanup.deleteOne,
      cloudinary.uploader.destroy,
    ] = originals;
    for (const [model, original] of references) model.exists = original;
  }
});

test("failed request uploads are queued once; successful requests retain their newly stored images", async () => {
  const { EventEmitter } = require("node:events");
  const {
    trackMediaUploads,
  } = require("../src/middlewares/mediaUploads.middleware");
  const {
    recordUploadedAsset,
  } = require("../src/services/uploadContext.service");
  const originals = [media.queueMediaCleanup, media.processMediaCleanup];
  let queued = 0;
  media.queueMediaCleanup = async (assets) => {
    queued++;
    assert.equal(assets[0].publicId, "failed-upload");
    return ["cleanup"];
  };
  media.processMediaCleanup = async () => {};
  try {
    const failed = new EventEmitter();
    failed.statusCode = 500;
    failed.writableFinished = false;
    trackMediaUploads({}, failed, () =>
      recordUploadedAsset(url("image", "failed-upload.jpg")),
    );
    failed.emit("finish");
    failed.emit("close");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(queued, 1);
    const saved = new EventEmitter();
    saved.statusCode = 200;
    saved.writableFinished = true;
    trackMediaUploads({}, saved, () =>
      recordUploadedAsset(url("image", "saved-upload.jpg")),
    );
    saved.emit("finish");
    saved.emit("close");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(queued, 1);
  } finally {
    [media.queueMediaCleanup, media.processMediaCleanup] = originals;
  }
});

test("a failed profile image upload never overwrites the existing avatar", async () => {
  const { User } = require("../src/models/user.model");
  const uploads = require("../src/utils/cloudinary");
  const { updateUser } = require("../src/controllers/user.controller");
  const originals = [
    User.findById,
    User.findByIdAndUpdate,
    uploads.uploadToCloudinary,
  ];
  let wrote = false;
  const actor = {
    _id: "507f1f77bcf86cd799439011",
    type: "teacher",
    role: "user",
    avatar: { url: url("image", "old-photo.jpg") },
  };
  User.findById = () => ({ select: async () => actor });
  User.findByIdAndUpdate = () => {
    wrote = true;
    throw Error("must not write");
  };
  uploads.uploadToCloudinary = async () => null;
  try {
    await assert.rejects(
      updateUser(
        {
          params: { id: actor._id },
          user: actor,
          body: { username: "Teacher" },
          file: { path: "fixture" },
        },
        {},
        (error) => {
          throw error;
        },
      ),
      /previous photo has been kept/,
    );
    assert.equal(wrote, false);
    assert.equal(actor.avatar.url, url("image", "old-photo.jpg"));
  } finally {
    [User.findById, User.findByIdAndUpdate, uploads.uploadToCloudinary] =
      originals;
  }
});
