'use strict';
module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define('Image', {
    id: { type: DataTypes.STRING, primaryKey: true },
    mimeType: DataTypes.STRING,
    data: DataTypes.BLOB,
    hash: DataTypes.JSON,
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {});
  Image.associate = function(models) {
    // associations can be defined here
  };
  return Image;
};