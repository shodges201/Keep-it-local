module.exports = function(sequelize, DataTypes) {
    var RSVPs = sequelize.define("RSVPs", {
      // The email cannot be null, and must be a proper email before creation
      userID: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      eventID:{
        type: DataTypes.INTEGER,
        allowNull: false,
        
      }
    });
    return RSVPs;
  };