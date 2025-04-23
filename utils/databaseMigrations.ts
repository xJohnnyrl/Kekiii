import db from "./database";

export async function runMigrations() {
  try {
    // Check if items table is empty
    const itemCount = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM items`
    );

    if (itemCount?.count === 0) {
      console.log("Adding default items to the shop...");

      const defaultItems = [
        {
          name: "Lottery Ticket",
          catchphrase: "Wow~! Do you think we can win~?!",
          description: "Buy and enter in /lotery to win konpeito stars",
          price_sugar: 0,
          price_konpeito: 100,
          category: "Lottery",
          rarity: "Common",
          is_sellable: true,
          image_url: "./public/img/lottery_ticket_item.png",
        },
        {
          name: "Kekiii's Ribbon",
          catchphrase: "With this, you'll stay together forever~!",
          description: "Opens an additional marriage slot.",
          price_sugar: 0,
          price_konpeito: 1000,
          category: "Shop",
          rarity: "Rare",
          is_sellable: false,
          image_url: "./public/img/ribbon_item.png",
        },
        {
          name: "Cake's Crown",
          catchphrase: "Shhh! Don't tell the Princess that Kekiii has this!",
          description:
            "Princess Cake's crown. Has no significant material value. It might give you a boost in experience though.",
          price_sugar: 0,
          price_konpeito: 1000000,
          category: "Booster",
          rarity: "Legendary",
          is_sellable: false,
          image_url: "./public/img/crown_item.png",
        },
      ];

      for (const item of defaultItems) {
        await db.run(
          `INSERT INTO items (
            name, catchphrase, description, price_sugar, price_konpeito, 
            category, rarity, is_sellable, image_url
          ) VALUES (
            $name, $catchprase, $description, $price_sugar, $price_konpeito,
            $category, $rarity, $is_sellable, $image_url
          )`,
          {
            $name: item.name,
            $cathphrase: item.catchphrase,
            $description: item.description,
            $price_sugar: item.price_sugar,
            $price_konpeito: item.price_konpeito,
            $category: item.category,
            $rarity: item.rarity,
            $is_sellable: item.is_sellable,
            $image_url: item.image_url,
          }
        );
      }
      console.log("Successfully added default items");
    }
  } catch (error) {
    console.error("Error running database migrations:", error);
  }
}
