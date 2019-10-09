import { Router } from 'express';
import passport from 'passport';
import { networkManager } from 'shared/helpers';
import { User } from 'database/entities/user.entity';

const router = Router({ mergeParams: true });

/**
 * @api {post} /user/:id/follow Follow a user
 * @apiName FollowUser
 * @apiGroup User
 *
 * @apiHeader Authorization Bearer [token]
 *
 * @apiParam {Number} id The id of the user to follow
 *
 * @apiError (HTTP Error Codes) 401 Unauthorized
 * @apiError (HTTP Error Codes) 404 Cannot find user
 */
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {

  const user = await User.findOne(req.params.id);

  // Does the user exist //
  if (user) {

    // Follow the user //
    await networkManager('follow', req.user.id, user.id);
    return res.status(200).send();

  }

  return next({ content: [{ detail: 'User not found' }], status: 404 });

});

export default router;
