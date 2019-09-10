import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { validate } from 'class-validator';
// import passport from 'passport';

import { Canvas } from 'database/entities/canvas.entity';
import { CanvasUploaded } from 'models/response.interfaces';

import { EVisibility } from 'models/enums';

const router = Router();

const upload = multer({ dest: 'uploads/canvas_images/', limits: { fileSize: 1000000, files: 1 } });

router.post('/', upload.single('canvas'), (req, res, next) => {

  if (req.file) {

    console.log(req.file);

    const canvas = new Canvas();
    canvas.description = ('description' in req.body && req.body.description ? req.body.description : null);
    canvas.imagePath = req.file.filename;
    canvas.mimetype = req.file.mimetype;
    canvas.visibility = EVisibility.followBacks; // Only followbacks to start
    canvas.publicAccessKey = crypto.randomBytes(32).toString('hex');

    validate(canvas).then((errors) => {

      if (errors.length > 0) {

        return next({
          content: errors.map((value, _index, _array) => {

            return { title: value.property, detail: value.constraints[Object.keys(value.constraints)[0]] };

          }),
          status: 400,
        });

      }

      console.log('"validation succeed"');

      canvas.save().then((canvasRecord: Canvas) => {

        console.log(`new canvas is: ${canvasRecord.id}`);

        const canvasId: CanvasUploaded = { canvasId: canvasRecord.id };
        res.json(canvasId);

      });

    });

  } else throw { content: [{ detail: 'Something went wrong' }], status: 500 };

});

export default router;
