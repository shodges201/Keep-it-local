module.exports = function(sequelize, DataTypes) {
    var Events = sequelize.define("Events", {
      // The email cannot be null, and must be a proper email before creation
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      // The password cannot be null
      category: {
        type: DataTypes.STRING,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false
      },
      upVotes: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
    return Events;
  };