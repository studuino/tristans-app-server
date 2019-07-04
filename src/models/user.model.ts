import { model, Schema } from 'mongoose';
import Error from '../util/error.util';

/**
 * The user model describes everything stored per user.
 * Any input with a validator is input assumed to come from the user
 * @type {Model}
 */
export default model('User', new Schema({
  fbid: Number,
  username: {
    type: String,
    validate: {
      validator: Error.mongoose('username'),
    },
    default: null,
  },
  firstName: {
    type: String,
    validate: {
      validator: Error.mongoose('firstName'),
    },
    default: null,
  },
  email: String,
  photo: String, // Path
  influence: { type: Number, default: 0 },
  contentNumber: { type: Number, default: 0 },
  settings: { // Can be updated
    notifications: {
      disabled: { type: Boolean, default: false },
    },
  },
  network: {
    followers: {
      count: Number,
      users: [
        {
          type: Schema.Types.ObjectId, ref: 'User',
        },
      ],
    },
    following: {
      count: Number,
      users: [
        {
          type: Schema.Types.ObjectId, ref: 'User',
        },
      ],
    },
  },
  notifications: [ // Optional
    {
      name: { type: String, enum: ['friends_joined_service', 'invitation', 'level_up'] }, // Can be updated
      data: Schema.Types.Mixed,
    },
  ],
  activity: [
    {
      hid: Schema.Types.ObjectId,
      hostType: { type: String, enum: ['user', 'meme', 'canvas', 'global'] },
      actionType: { type: String, enum: ['follow', 'star', 'upload', 'update_username'] }, // Can be updated
      utcTime: Date,
    },
  ],
  misc: {
    nativeAppInstalled: { type: Boolean, default: false },
  },
}));
