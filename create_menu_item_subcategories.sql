CREATE TABLE menu_item_subcategories (id serial PRIMARY KEY, menu_item_id integer REFERENCES menu_items(id) ON DELETE CASCADE, subcategory_id integer REFERENCES categories(id) ON DELETE CASCADE);
