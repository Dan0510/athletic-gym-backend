const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnectionDB } = require("../../config/db/connection");
const { getSecret } = require('../../config/gcp/gcpSecretManager');
//const db = require('../../config/db/connection');


const AuthModel = require('../../models/auth/auth.model');

exports.login = async (req) => {

    const { username, password } = req.body;
    const db = await getConnectionDB();

    if (!username || !password) {
        throw new Error("Username and password required");
    }

    const user = await AuthModel.getUserByUsername(db, username);

    if (!user) {
        throw new Error("User not found");
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        throw new Error("Incorrect password");
    }

    const JWT_SECRET = await getSecret('JWT_SECRET-athletic-gym');

    const token = jwt.sign(
        { id_user: user.id_user, username: user.username },
        JWT_SECRET,
        { expiresIn: '12h' }
    );

    await AuthModel.createSession(db, {
        id_user: user.id_user,
        username: user.username,
        token,
        ip: req.ip,
        user_agent: req.headers['user-agent']
    });

    return {
        success: true,
        token,
        user
    };
};

exports.logout = async (req) => {

    const { token } = req.body;

    await AuthModel.closeSession(db, token);

    return {
        success: true,
        message: "Logged out"
    };
};

exports.validateToken = async (req) => {

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) throw new Error("Token required");

    const decoded = jwt.verify(token, JWT_SECRET);

    const session = await AuthModel.getActiveSession(db, token);

    if (!session) throw new Error("Invalid session");

    return {
        success: true,
        user: decoded
    };
};