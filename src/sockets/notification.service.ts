import { Server } from 'socket.io';
import { Notification } from '../models/notification.model';
import { ParentsChild } from '../models/parentsChild.model';
import { StuAssignToClass } from '../models/stuAssignToClass.model';
import { User } from '../models/user.model';
import { emitToRoom } from '../services/realtime.service';

let io: Server | undefined;
export const initNotificationSocket = (server: Server) => { io = server; };
type Event = { to: any; message: string; type: string; id: any; studentId?: any; classId?: any; eventKey?: string };
export const createNotification = async (event: Event) => {
  const recipient = await User.findById(event.to).select('type notificationPreferences state isActive');
  if (!recipient || recipient.isActive === false || recipient.state !== 'active') return null;
  if (recipient.type === 'parent' && event.studentId &&
      !await ParentsChild.exists({ parentId: event.to, childId: event.studentId })) return null;
  if (recipient.notificationPreferences?.[event.type] === false) return null;
  const key = event.eventKey ? `${event.eventKey}:${event.to}` : undefined;
  const notification = key
    ? await Notification.findOneAndUpdate({ eventKey: key }, { $setOnInsert: { ...event, eventKey: key, deliveryStatus: 'pending' } }, { new: true, upsert: true, setDefaultsOnInsert: true })
    : await Notification.create({ ...event, deliveryStatus: 'pending' });
  io?.to(String(event.to)).emit('newNotification', notification);
  emitToRoom(`user:${event.to}`, 'dataChanged', { type: event.type, id: event.id, studentId: event.studentId, classId: event.classId });
  return notification;
};
export const notifyStudentFamily = async (event: Omit<Event, 'to'> & { studentId: any; notifyStudent?: boolean; notifyParent?: boolean }) => {
  const recipients = new Set<string>();
  if (event.notifyStudent !== false) recipients.add(String(event.studentId));
  if (event.notifyParent !== false) for (const parent of await ParentsChild.find({ childId: event.studentId }).distinct('parentId')) recipients.add(String(parent));
  await Promise.all([...recipients].map(to => createNotification({ ...event, to })));
};
export const notifyClass = async (event: Omit<Event, 'to'> & { classId: any; notifyStudent?: boolean; notifyParent?: boolean }) => {
  const students = await StuAssignToClass.find({ classId: event.classId }).distinct('studentId');
  await Promise.all(students.map(studentId => notifyStudentFamily({ ...event, studentId })));
};
