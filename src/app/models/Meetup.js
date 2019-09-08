import Sequelize, { Model } from "sequelize";
import { isBefore } from "date-fns";

class Meetup extends Model {
  static init(connection) {
    super.init(
      {
        title: Sequelize.STRING,
        description: Sequelize.STRING,
        location: Sequelize.STRING,
        date: Sequelize.DATE,
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date());
          }
        }
      },
      {
        sequelize: connection
      }
    );

    return this;
  }

  static associate(models) {
    //this.hasMany(models.Subscription, { foreignKey: "meetup_id" });
    this.belongsTo(models.File, { foreignKey: "banner_id", as: "banner" });
    this.belongsTo(models.User, { foreignKey: "user_id" });
  }
}

export default Meetup;