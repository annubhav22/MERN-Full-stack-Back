const { Category } = require('../model/Category');
const { User } = require('../model/User');

exports.fetchAllUsers = async (req, res) => {
  // TODO: we will perhaps restrict this to admins in future
  try {
    const users = await User.find({}).exec();
    res.status(200).json(users);
  } catch (err) {
    res.status(400).json(err);
  }
};
exports.fetchUserById = async (req, res) => {
  const { id } = req.user;
  console.log(id)
  try {
    const user = await User.findById(id);
    res.status(200).json({id:user.id,addresses:user.addresses,email:user.email,role:user.role});
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};
