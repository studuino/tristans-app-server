import { User } from 'database/entities/user.entity';
import { Canvas } from 'database/entities/canvas.entity';
import { validate, ValidationError } from 'class-validator';
import { userContentNumberManager, NotificationManager } from 'shared/helpers';

/**
 * Create a canvas along with all of it's associated relations
 * @param  canvas      Canvas Object
 * @param  userid      The userid of the canvas owner
 * @param  ignoreLimit Create as many canvases as you want
 * @return             The created canvas record
 */
export async function createNewCanvas(canvas: Canvas, userid: number, ignoreLimit?: boolean): Promise<Canvas> {

  // Validate the canvas record //
  const res = await validate(canvas);
  if (res.length > 0) {
    throw res;
  }

  const user = await User.findOne(userid, { relations: ['statistics', 'canvases'] });

  // Link relations //
  canvas.user = user;

  /** @todo (Production) Implmenent canvas invites (invite users) */

  // Validate that the user has uploaded less than 15 canvases a day //
  const canvasList = user.canvases;

  if (canvasList.length >= 15 && !ignoreLimit) {

    const canvas = canvasList[canvasList.length - 15];
    const diffTime = +new Date() - +canvas.utc;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      const error = new ValidationError();
      error.property = 'canvas';
      error.constraints = { limit: 'Client can only upload 15 canvases a day' };
      error.children = [];
      throw [error];
    }

  }

  // Generate new canvas //
  const newCanvas = await canvas.save();

  // Update user stats //
  await userContentNumberManager('add', user.id, 1);

  // Send subscribed users a notification about the uploaded canvas //
  NotificationManager.sendUploadedCanvasPushNotifications(user, newCanvas.id);

  return newCanvas;

}
