//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('loadsh');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true })); // Add this line to configure body-parser

mongoose
  .connect('mongodb+srv://admin-emin:Test123@cluster0.ugfsqbu.mongodb.net/todolistDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(3000, () => {
      console.log('Listening on port 3000!');
    });
  })
  .catch(error => {
    console.log(error);
  });

const itemsSchema = {
  name: String,
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todolist!',
});

const item2 = new Item({
  name: 'Hit the + button to add a new item.',
});

const item3 = new Item({
  name: '<-- Hit this to delete an item.',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);

/*Item.insertMany(defaultItems)
  .then(() => {
    console.log("Default items inserted successfully");
  })
  .catch(error => {
    console.log(error);
  });*/

app.get('/', function (req, res) {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log('Default items inserted successfully');
          })
          .catch(error => {
            console.log(error);
          });
        res.redirect('/');
      } else {
        res.render('list', { listTitle: 'Today', newListItems: foundItems });
      }
    })
    .catch(error => {
      console.log(error);
    });
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(foundList => {
      if (foundList) {
        // List already exists, render it
        res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        // List doesn't exist, create a new one
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list
          .save()
          .then(() => {
            console.log('New list created successfully');
            res.redirect('/' + customListName);
          })
          .catch(err => {
            console.log(err);
          });
      }
    })
    .catch(err => {
      console.log(err);
    });
});

app.post('/', function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        foundList.items.push(item);
        foundList
          .save()
          .then(() => {
            res.redirect('/' + listName);
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.log(error);
      });
  }
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log('Item deleted successfully');
      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
    });
  }
  else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      { useFindAndModify: false }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(error => {
        console.log(error);
      });   
  }

 
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.listen(5000, function () {
  console.log('Server started on port 5000');
});
