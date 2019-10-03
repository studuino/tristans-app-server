import { Router } from 'express';
import passport from 'passport';
import { checkReactionToCanvas } from 'shared/helpers';
import { Canvas } from 'database/entities/canvas.entity';
import { ContentCard, EContentType } from 'shared/models';

import env from 'conf/env';

const router = Router({ mergeParams: true });

/**
 * @api {get} /canvas/:id Get a canvas document
 * @apiName GetCanvas
 * @apiGroup Canvas
 *
 * @apiHeader (Optional Headers) Authorization Bearer [token]
 *
 * @apiParam {Number} id The id of the canvas
 *
 * @apiSuccess (200) {Object} contentCard JSON object describing the canvas content card
 *
 * @apiError (HTTP Error Codes) 401 Unauthorized to get
 * @apiError (HTTP Error Codes) 404 Cannot find canvas
 */
router.get('/', async (req, res, next) => {

  passport.authenticate('jwt', { session: false }, async (_err, user, _info) => {

    const canvas = await Canvas.findOne(req.params.id, { relations: ['user'] });

    if (canvas) {

      let userReacted = false;

      // Check if the canvas has been starred //
      if (user) {
        userReacted = await checkReactionToCanvas(req.params.id, user.id);
      }

      const contentCard: ContentCard = {
        type: EContentType.Canvas,
        id: canvas.id,
        users: {
          primary: {
            id: canvas.user.id,
            firstName: canvas.user.firstname,
            username: canvas.user.username,
            photo: canvas.user.profileImg },
        },
        imagePath: `${env.host}/api/canvas/image/${canvas.imagePath}`,
        description: canvas.description,
        stars: canvas.stars,
        starred: userReacted,
        utcTime: +canvas.utc,
      };

      return res.send(contentCard);

    }

    return next({ content: [{ detail: 'Canvas not found' }], status: 404 });

  })(req, res, next);

});

export default router;