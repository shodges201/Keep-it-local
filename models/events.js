module.exports = function(sequelize, DataTypes) {
    var Events = sequelize.define("Events", {
      // The email cannot be null, and must be a proper email before creation
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      date:{
        type: DataTypes.STRING,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false
      },
      coords: {
        type: DataTypes.STRING,
        allowNull: false
      },
      upVotes: {
        type: DataTypes.INTEGER,
        allowNull: false
      }, 
      creatorID:{
        type: DataTypes.STRING,
        allowNull: false
      }
    });
    return Events;
  };