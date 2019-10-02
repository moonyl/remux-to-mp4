import { Strategy as PassportLocalStrategy } from "passport-local";
import User from "../setup/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config";

const localSignupStrategy = new PassportLocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    session: false,
    passReqToCallback: true
  },
  (req, email_t, password_t, done) => {
    console.log("localSignupStrategy", req.body);
    const email = email_t.trim();
    const password = password_t.trim();
    const firstName = req.body.firstName.trim();
    const lastName = req.body.lastName.trim();
    User.findOne({ email }, (err, doc) => {
      if (err) {
        done(err);
        return;
      }
      if (!doc) {
        const newUser = new User({ email, password, firstName, lastName });
        console.log({ newUser });
        return bcrypt.genSalt((saltError, salt) => {
          if (saltError) {
            done(saltError);
            return;
          }

          return bcrypt.hash(password, salt, (hashError, hash) => {
            if (hashError) {
              done(hashError);
            }
            // replace password to hash value
            newUser.password = hash;
            newUser.save(err => {
              if (err) {
                done(err);
                return;
              }
              User.findOne({ email }, (err, doc) => {
                if (err) {
                  done(err);
                  return;
                }
                console.log("save & find OK, password: ", hash);
                done(null);
                return;
              });
            });
          });
        });
      }
      done({ name: "Duplicated", code: 11000 });
    });
  }
);

const localLoginStrategy = new PassportLocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    session: false,
    passReqToCallback: true
  },
  (req, email_t, password_t, done) => {
    const email = email_t.trim();
    const password = password_t.trim();

    return User.findOne({ email }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        let error = new Error("Incorrect email or password");
        error.name = "IncorrectCredentialsError";
        return done(error);
      }

      return bcrypt.compare(password, user.password, (passwordErr, isMatch) => {
        if (passwordErr) {
          return done(passwordErr);
        }
        if (!isMatch) {
          let error = new Error("Incorrect email or password");
          error.name = "IncorrectCredentialsError";
          return done(error);
        }

        const payload = { sub: user._id };
        const token = jwt.sign(payload, config.jwtSecret);
        console.log("token: ", token);
        const { lastName } = user;
        console.log({ lastName });
        return done(null, token, lastName);
      });
    });
  }
);
export { localSignupStrategy, localLoginStrategy };
