
  var createTable = function(sequelize, DataTypes, id) {
    var Messages = sequelize.define("Messages_"+id, {
      // The email cannot be null, and must be a proper email before creation
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      // The password cannot be null
      creatorID: {
        type: DataTypes.STRING,
        allowNull: false
      },
      upVotes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      }
    });
    return Messages;
  };

  module.exports = {createTable: createTable}