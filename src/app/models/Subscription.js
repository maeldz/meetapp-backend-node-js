import { Model } from "sequelize";

class Subscription extends Model {
  static init(connection) {
    super.init(
      {},
      {
        sequelize: connection
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Meetup, { foreignKey: "meetup_id" });
    this.belongsTo(models.User, { foreignKey: "user_id" });
  }
}

export default Subscription;
