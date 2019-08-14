module.exports = function(sequelize, DataTypes) {
    var referralCodes = sequelize.define("ReferralCodes", {
      // The email cannot be null, and must be a proper email before creation
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      creatorID:{
        type: DataTypes.STRING,
        allowNull: false,
        
      }
    });
    return referralCodes;
  };