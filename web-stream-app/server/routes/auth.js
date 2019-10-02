import express from "express";
import passport from "passport";
import { localSignupStrategy, localLoginStrategy } from "./passportStrategy";

passport.use("local-signup", localSignupStrategy);
passport.use("local-login", localLoginStrategy);

const router = express.Router();

const validateLoginForm = payload => {
  const { email, password } = payload;
  const message = "Check the form for errors.";
  if (typeof email !== "string" || email.trim().length === 0) {
    return {
      success: false,
      errors: { email: "Please provide your email address." },
      message
    };
  }

  if (typeof password !== "string" || password.trim().length === 0) {
    return {
      success: false,
      errors: { password: "Please provide your password." },
      message
    };
  }

  return { success: true };
};

const validateSignupForm = payload => {
  const message = "Check the form for errors.";
  const { email, password, firstName, lastName } = payload;
  const result = validateLoginForm({ email, password });
  if (!result.success) {
    return result;
  }
  if (typeof firstName !== "string" || firstName.trim().length === 0) {
    return {
      success: false,
      errors: { firstName: "Please provide your first name." },
      message
    };
  }
  if (typeof lastName !== "string" || lastName.trim().length === 0) {
    return {
      success: false,
      errors: { lastName: "Please provide your last name." },
      message
    };
  }
  return { success: true };
};

router.post("/signup", (req, res, next) => {
  console.log("req.body: ", req.body);
  const validationResult = validateSignupForm(req.body);
  if (!validationResult.success) {
    return res.status(400).json(validationResult);
  }

  return passport.authenticate("local-signup", err => {
    const message = "Check the form for errors.";
    if (err) {
      console.log("err: ", err);
      if (err.name === "Duplicated" && err.code === 11000) {
        return res.status(409).json({
          success: false,
          message,
          email: "This email is already taken."
        });
      }
      return res.status(400).json({
        success: false,
        message: "Could not process the form."
      });
    }
    console.log("local-signup");
    return res.status(200).json({
      success: true,
      message: "You have successfully signed up! Now you should be able to log in."
    });
  })(req, res, next);
});

router.post("/login", (req, res, next) => {
  const result = validateLoginForm(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return passport.authenticate("local-login", (err, token, user) => {
    console.log("local-login");
    if (err) {
      const { message } = err;
      if (err.name === "IncorrectCredentialsError") {
        return res.status(400).json({
          success: false,
          message
        });
      }
      return res.status(400).json({
        success: false,
        message: "Could not process the form."
      });
    }

    return res.json({
      success: true,
      message: "You have successfully logged in!",
      token,
      user
    });
  })(req, res, next);
});

export default router;
