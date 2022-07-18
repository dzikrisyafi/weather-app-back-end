var express = require('express');
var router = express.Router();
const { User } = require('../models');
const Validator = require('fastest-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/VerifyToken');

const v = new Validator();

/* GET users listing. */
router.get('/', verifyToken, async (req, res, next) => {
  const users = await User.findAll({ attributes: ['id', 'name', 'email'] });

  if (!users.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Users not found'
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Success to get users',
    data: users
  });
});

router.post('/register', async (req, res, next) => {
  const schema = {
    name: 'string|empty:false',
    email: 'string|email|empty:false',
    password: 'string|min:8|empty:false',
    confirm_password: 'string|equal|field:password|empty:false',
  }

  const validate = v.validate(req.body, schema);
  if (validate.length) {
    return res.status(400).json(validate);
  }

  const { name, email, password } = req.body;
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  try {
    await User.create({
      name, email, password: hashPassword
    });

    res.json({
      status: 'success',
      message: 'Your account has been successfully created'
    })
  } catch (error) {
    console.log(error);
  }
});

router.post('/login', async (req, res, next) => {
  const schema = {
    email: 'string|email|empty:false',
    password: 'string|min:8|empty:false',
  }

  const validate = v.validate(req.body, schema);
  if (validate.length) {
    return res.status(400).json(validate);
  }

  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not registered'
    });
  }

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) {
    return res.status(400).json({
      status: 'fail',
      message: 'Password incorrect'
    })
  }

  const { id, name, email } = user;
  const accessToken = jwt.sign({id, name, email}, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '20s'
  });
  const refreshToken = jwt.sign({id, name, email}, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '1d'
  });

  await User.update({ refresh_token: refreshToken }, { where: { id: id } });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({ 
    status: 'success',
    message: 'Login Successful',
    user: {
      id: id,
      name: name
    } 
  });
});

router.get('/token', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.sendStatus(401);
    }

    const user = await User.findOne({
      where: {
        refresh_token: refreshToken
      }
    });
    if (!user) {
      res.sendStatus(403);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403);
      const { id, name, email } = user;
      const accessToken = jwt.sign({id, name, email}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15s'
      });
      res.json({ accessToken });
    });
  } catch (error) {
    console.log(error);
  }
});

router.delete('/logout', async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.sendStatus(204);
  }

  const user = await User.findOne({
    where: {
      refresh_token: refreshToken
    }
  });
  if (!user) {
    res.sendStatus(204);
  }
  const { id } = user;
  await User.update({ refresh_token: null }, {
    where: {
      id: id
    }
  });

  res.clearCookie('refreshToken');
  return res.sendStatus(200);
});

module.exports = router;
