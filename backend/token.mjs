import jwt from 'jsonwebtoken';
console.log(jwt.sign({ id: '6a9e813c9cb61f9972062b84' }, '1234', { expiresIn: '1h' }));