const db = require('./db');
const fileQueries = require('./file');
const TABLE_NAME = 'Posts';

exports.dropTable = `
  DROP TABLE IF EXISTS ${TABLE_NAME};
`

exports.createTable = `
  CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id SERIAL NOT NULL,
    user_id INT NOT NULL,
    image_id INT,
    content TEXT,
    created_at TIMESTAMP DEFAULT LOCALTIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (image_id) REFERENCES Files(id)
  );
`

exports.createPost = async (user_id, content, image) => {
  let image_id;
  if (image) {
    image_id = await fileQueries.insertFile(image);
  }
  const { rows } = await db.query(
    `
      INSERT INTO ${TABLE_NAME}
      (user_id, content, image_id)
      VALUES($1, $2, $3)
      RETURNING id;
    `,
    [user_id, content, image_id]
  )
  if (rows.length === 0) {
    throw new Error('Some Error Occurred');
  }
  return rows[0].id;
}

exports.getPost = async (id) => {
  const { rows } = await db.query(
    `
      SELECT user_id, content, image_id FROM ${TABLE_NAME}
      WHERE id=$1;
    `,
    [id]
  );
  if(rows.length === 0) {
    throw new Error('Post not found');
  }
  let image;
  if(rows[0].image_id) {
    image = await fileQueries.getFile(rows[0].image_id);
  }
  rows[0].image = image;
  return rows[0];
}

exports.getUserPosts = async (user_id) => {
  const { rows } = await db.query(
    `
      SELECT id, content, image_id FROM ${TABLE_NAME}
      WHERE user_id=$1
      LIMIT 30;
    `,
    [user_id]
  )
  for(var i = 0;i < rows.length;i+=1) {
    if(rows[i].image_id) {
      rows[i].image = await fileQueries.getFile(rows[i].image_id)
    }
  }
  return rows;
}
