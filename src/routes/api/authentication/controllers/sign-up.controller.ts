import facebook from 'fb';
import UserModel from '../../../../models/user.model';
import ResponseFormat from '../../../../util/response-format.util';

export const postSignup = (req, res) => {

  const facebookAccessToken = req.body.access_token;
  const responseObj = new ResponseFormat();

  facebook.api('me', {
    fields: ['first_name', 'last_name', 'id'],
    access_token: facebookAccessToken,
  }, async (response) => {

    if (response.error) {

      responseObj.addError({
        message: response.error.message,
        reason: 'You access token is null or expired',
      });

      return res.send(responseObj.output);

    }

    const isRegistered = await UserModel.findOne({ fbid: response.id });

    if (!isRegistered) {

      const user = await UserModel.create({
        fbid: response.id,
        firstName: response.first_name,
      });

      responseObj.addContent({
        completed: true,
        message: 'Registration completed',
        user,
      });

      return res.send(responseObj.output);

    } else {

      responseObj.addError({
        message: 'You are already registered with this facebook account',
      });

      return res.send(responseObj.output);

    }

  });

};