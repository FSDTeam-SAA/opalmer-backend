import { Schema } from "mongoose";
import {
  CloudAsset,
  mediaFields,
  processMediaCleanup,
  queueMediaCleanup,
  recordAssets,
} from "../services/mediaCleanup.service";

const staged = Symbol("cloudinaryCleanup");
export const mediaCleanupPlugin = (
  schema: Schema,
  options: { model: string },
) => {
  const fields = mediaFields[options.model];
  if (!fields)
    throw new Error("Media cleanup model must declare its asset fields");
  const collect = (records: any[]) =>
    records.flatMap((record) => recordAssets(record, fields));
  const finish = async (context: any) => {
    const assets: CloudAsset[] = context[staged] ?? [];
    context[staged] = [];
    if (!assets.length) return;
    const session = context.getOptions?.().session ?? context.$session?.();
    if (session?.inTransaction()) return; // The periodic worker runs after commit.
    try {
      const keys = await queueMediaCleanup(assets);
      await processMediaCleanup(keys);
    } catch {
      console.error("Media cleanup delayed; staged requests will be retried");
    }
  };
  const capture = async function (this: any) {
    const operation = this.op;
    const update = this.getUpdate?.() ?? {};
    const changed = Object.entries(update).flatMap(([key, value]) =>
      key.startsWith("$") && value && typeof value === "object"
        ? Object.keys(value)
        : [key],
    );
    if (
      !/delete|replace/i.test(operation) &&
      !changed.some(
        (key) =>
          key === "isDeleted" ||
          fields.some(
            (field) =>
              key === field ||
              key.startsWith(`${field}.`) ||
              field.startsWith(`${key}.`),
          ),
      )
    )
      return;
    const query = this.model
      .find(this.getFilter())
      .select([...fields, "isDeleted"].join(" "));
    if (!["deleteMany", "updateMany"].includes(operation)) query.limit(1);
    const session = this.getOptions().session;
    if (session) query.session(session);
    this[staged] = collect(await query.lean());
    await queueMediaCleanup(this[staged], session);
  };
  for (const operation of [
    "findOneAndUpdate",
    "findOneAndReplace",
    "updateOne",
    "updateMany",
    "replaceOne",
    "findOneAndDelete",
    "deleteOne",
    "deleteMany",
  ]) {
    (schema as any).pre(operation, { query: true, document: false }, capture);
    (schema as any).post(
      operation,
      { query: true, document: false },
      async function (this: any) {
        await finish(this);
      },
    );
  }
  schema.pre("save", async function (this: any) {
    if (
      this.isNew ||
      (!fields.some((field) => this.isModified(field)) &&
        !this.isModified("isDeleted"))
    )
      return;
    const query = this.constructor
      .findById(this._id)
      .select([...fields, "isDeleted"].join(" "));
    const session = this.$session();
    if (session) query.session(session);
    this[staged] = collect([await query.lean()]);
    await queueMediaCleanup(this[staged], session);
  });
  schema.post("save", async function (this: any) {
    await finish(this);
  });
  schema.pre(
    "deleteOne",
    { document: true, query: false },
    async function (this: any) {
      this[staged] = collect([this]);
      await queueMediaCleanup(this[staged], this.$session());
    },
  );
  schema.post(
    "deleteOne",
    { document: true, query: false },
    async function (this: any) {
      await finish(this);
    },
  );
};
