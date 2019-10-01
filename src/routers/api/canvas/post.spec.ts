import supertest from 'supertest';
import express from 'express';
import post from './post';
import { getNewAuthorizedUser } from 'spec-helpers/authorized-user-setup';
import { httpErrorMiddleware } from 'shared/helpers';
import { Canvas } from 'database/entities/canvas.entity';
import { User } from 'database/entities/user.entity';

describe('POST canvas', () => {

  let app: express.Express;
  let userInfo: { token: string, userid: number };

  beforeAll(async () => {
    userInfo = await getNewAuthorizedUser();
    app = express();
    app.use(post);
    app.use(httpErrorMiddleware);
  });

  // Remove the test authorized user //
  afterAll(async () => {
    const user = await User.findOne(userInfo.userid);
    await user.remove();
  });

  it('should create a canvas with ideal inputs', async () => {
    const description = 'Hi there';

    const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .field('description', description)
      .attach('canvas', 'src/spec-helpers/images/medium-image.jpg');

    expect(res.body.canvasId).toBeDefined();

    const canvas = await Canvas.findOne(res.body.canvasId);
    expect(canvas.description).toEqual(description);

    const user = await User.findOne(userInfo.userid, { relations: ['statistics'] });
    expect(user.statistics.contentNum).toBeGreaterThan(0);

    await canvas.remove();
  });

  it('should fail if no auth token is present', async () => {

    let res: any;

    res = await supertest(app)
      .post('/')
      .field('description', ''); // line can also be removed
      // .attach('canvas', 'src/spec-helpers/images/medium-image.jpg');
      // TCP stream for image upload breaks if auth fails //

    expect(res.status).toEqual(401);
  });

  it('should create a canvas with no description', async () => {

    const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .field('description', '') // line can also be removed
      .attach('canvas', 'src/spec-helpers/images/medium-image.jpg');

    expect(res.body.canvasId).toBeDefined();

    const canvas = await Canvas.findOne(res.body.canvasId);

    expect(canvas.description).toEqual(null);

    await canvas.remove();
  });

  it('should fail with a description that\'s too long', async () => {

    const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .field('description', '1'.repeat(256)) // line can also be removed
      .attach('canvas', 'src/spec-helpers/images/medium-image.jpg');

    expect(res.body.errors).toBeDefined();
    expect(res.status).toEqual(400);
    expect(res.body.errors[0].title).toEqual('description');
  });

  it('should fail if canvas image is too big', async () => {
    const description = 'Testing';

    const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .field('description', description)
      .attach('canvas', 'src/spec-helpers/images/large-image.jpg');

    expect(res.body.errors).toBeDefined();
    expect(res.status).toEqual(400);
    expect(res.body.errors[0].title).toEqual('file');
  });

  it('should fail if canvas image is wrong file type', async () => {
    const description = 'Testing';

    const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .field('description', description)
      .attach('canvas', 'src/spec-helpers/images/moving-image.gif');

    expect(res.body.errors).toBeDefined();
    expect(res.status).toEqual(400);
    expect(res.body.errors[0].title).toEqual('file');
  });

  it('should fail if canvas image is missing', async () => {
    const description = 'Testing';

    const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .field('description', description);

    expect(res.body.errors).toBeDefined();
    expect(res.status).toEqual(400);
    expect(res.body.errors[0].title).toEqual('file');
  });

  it('should fail if > 6 canvases uploaded a day', async () => {

    const canvasArray: number[] = [];

    // Create a lot of canvases //
    for (let i = 0; i < 7; i += 1) {
      const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .attach('canvas', 'src/spec-helpers/images/medium-image.jpg');

      if (i < 6) {
        expect(res.body.canvasId).toBeDefined();
        canvasArray.push(res.body.canvasId);
      } else {
        // On 7th canvas attempted to be created today //
        expect(res.body.errors).toBeDefined();
      }
    }

    canvasArray.forEach(async (value) => {
      const canvas = await Canvas.findOne(value);
      canvas.remove();
    });

  });

  it('should succeed if < 6 canvases uploaded a day', async () => {

    const canvasArray: number[] = [];

    // Create 6 canvases //
    for (let i = 0; i < 6; i += 1) {
      const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .attach('canvas', 'src/spec-helpers/images/medium-image.jpg');

      canvasArray.push(res.body.canvasId);
    }

    // Set the time of creation for the first canvas to yesterday //
    const canvas = await Canvas.findOne(canvasArray[0]);
    canvas.utc.setDate(canvas.utc.getDate() - 1);
    await canvas.save();

    // Create another canvas //
    const res = await supertest(app)
      .post('/')
      .set('Authorization', `Bearer ${userInfo.token}`)
      .attach('canvas', 'src/spec-helpers/images/medium-image.jpg');

    // Canvas should be made //
    expect(res.body.canvasId).toBeDefined();

    canvasArray.push(res.body.canvasId);

    canvasArray.forEach(async (value) => {
      const canvas = await Canvas.findOne(value);
      canvas.remove();
    });

  });

});
