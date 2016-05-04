# Paginated Redux

A higher order [Redux](https://github.com/reactjs/redux) reducer (or transducer)
that adds pagination, sorting, and filtering to a reducer of an array of
objects.

It is distributed as an ES5 CommonJS module.

## Installation

`npm install paginated-redux --save-dev`

`import paginated from 'paginated-redux'`

or

`const paginated = require('paginated-redux')`

## Usage

This is a "higher order" reducer. That is, it modifies an existing reducer and
extends it with new functionality. It assumes the base reducer's state is simply
an array of objects. It then acts on that array providing the ability to
paginate it, sort it (on a user-definable property of each object in the array),
and filter the array with a string, matching it against the content of the
properties of the objects in the array.

To set it up, let's first assume you have a simple reducer that is an array of
user objects. I'm also assuming, here, that you have some action-constants
defined in a separate file called 'actionTypes.js'.

```javascript
import paginated from 'paginated-redux';
import {
  STORE_USERS,
  ADD_USER,
  UPDATE_USER,
  REMOVE_USER,
  GOTO_USERS_PAGE,
  NEXT_USERS_PAGE,
  PREV_USERS_PAGE,
  SORT_USERS,
  FILTER_USERS
} from 'actionTypes';

const updatedUser = user => {
  // ...update user object
  return user;
};

// Define base users reducer along with basic user actions.
const users = (state = [], action) => {
  switch (action.type) {
  case STORE_USERS:
    return action.users;
  case ADD_USER:
    return [...state, action.user];
  case UPDATE_USER:
    return state.map(updatedUser(action.user));
  case REMOVE_USER:
    return state.filter(user => (user.id !== action.id));
  default:
    return state;
  }
};

// Extend the users reducer with paginated actions, and pass the user-specific
// pagination actions to the paginated transducer (this way, if you have
// multiple paginated-extended reducers, you can keep each paginated array's
// action separated).
const paginatedUsers = paginated(users, {
  GOTO_PAGE: GOTO_USER_PAGE,
  NEXT_PAGE: NEXT_USER_PAGE,
  PREV_PAGE: PREV_USER_PAGE,
  FILTER: FILTER_USERS,
  SORT: SORT_USERS
});

// Finally, export the newly extended reducer instead of the base reducer.
export default paginatedUsers;
```

The new extended reducer will now have a modified state. The original array of
user objects will now be stored in a property called `list`, and some new
pagination-oriented properties will also be added which you can use for
rendering your UI (e.g., what page you're on, total pages, current filter,
etc.).

## New Properties in Reducer State

#### `list`
This is the total, original, array from the base reducer. When you
modify the base array (e.g., by adding a new object, removing one, etc.) this
array will be updated.

#### `pageList`
This is an array of objects which represents the current page.

#### `cacheList`
This is mostly used internally, but represents all items from
`list`, but filtered against `filter` which is what's actually used to calculate
the `pageList` as the pages correspond to what's left over in the `cacheList`.

#### `page`
The current page number (starting from 1).

#### `total`
The total pages currently available based on `cacheList`.

#### `per`
The number of elements that are used for each page.

#### `order`
The current sort order (either "asc" or "desc").

#### `by`
The current sorting property. For example you could sort an array of user
objects by a property "name" (based on the `order`) or change this to instead
sort by their "lastModified" property (if those are properties you have in your
user object).

## Paginated Actions

There are new actions you can execute, and define with reducer-specific names,
which will act on your array of objects in certain ways, as well as maintain the
current pagination state.

Note that in the example action creators, I'm using user-specific action names
since these are what I passed into the paginated transducer to act on this user
reducer (e.g., `GOTO_PAGE: GOTO_USER_PAGE`).

#### `GOTO_PAGE`
Go to a specific page defined in the action. For example, to go
to page 5, you might write an action creator that looks like this:

```javascript
export const gotoUserPage = page => ({
  type: GOTO_USER_PAGE,
  page
});
```

#### `NEXT_PAGE`
Go to the next page in list. If at the last page, go to the first
page (wraps back around). If you don't want to have this wrapping effect, simply
check, in your UI, if the current `page` in the state is equal to the `total`
and either disable or remove the "next" button in your UI.

```javascript
export const nextUserPage = () => ({
  type: NEXT_USER_PAGE
});
```

#### `PREV_PAGE`
Go to the previous page in the list. If on the first page, go to
the last page (wraps back around). If you don't want to have this wrapping
effect, simply check, in your UI, if the current `page` in the state is equal to
1 and either disable or remove the "previous" button in your UI.

```javascript
export const prevUserPage = () => ({
  type: PREV_USER_PAGE
});
```

#### `SORT`
Sort the current paginated list by the property defined in `by`. If the
current value of `by` in the state is equal to the value passed into the `SORT`
action, simply toggle the order (reverse the order that it is currently in). If
the value of `by` in the state is different than the value passed into the
`SORT` action, then re-order the list based on the new value in 'asc' order.

```javascript
export const sortUsers = by => ({
  type: SORT_USERS,
  by
});
```

#### `FILTER`
Filter the list down by matching any property of the objects in the
array against the value of `filter` in the state. This changes the `cacheList`
by creating a new array with all matching objects from `list` that correspond to
`filter`.

```javascript
export const filterUsers = filter => ({
  type: FILTER_USERS,
  filter
});
```

## Defaults

You can specify some default values for the paginated reducer during creation by
passing a third argument to `paginated` with a set of options defined as
follows.

```javascript
const paginatedUsers = paginated(users, {
  GOTO_PAGE: GOTO_USER_PAGE,
  NEXT_PAGE: NEXT_USER_PAGE,
  PREV_PAGE: PREV_USER_PAGE,
  SORT: SORT_USERS,
  FILTER: FILTER_USERS
}, {
  defaultPage = 1,
  defaultSortOrder = 'asc',
  defaultSortBy = 'name',
  defaultPer = 10,
  defaultFilter = '',
  defaultTotal = 0
})
```

So, for example, if you want each of your pages to contain 20 objects instead of
10, simply define `defaultPer` with a value of 20. Note that these are simply
the **initial** values for these properties. You can change them later in your
program by setting them directly. When you call the paginated actions, the
values of these properties do change ;)

## Dependencies

This is a higher order reducer that works with a
[Redux](https://github.com/reactjs/redux) reducer, so it doesn't really make
sense outside that context.

It also depends on the base reducer being simply an array of objects (not a
complex object itself).

## Future Plans

- add ability to define sort order when calling the action
- add ability to filter based on custom criteria (rather than every property)
- possibly rename `cacheList` to `filteredList` as it is more meaningful
- maybe also rename `pageList` to `pagedList` to indicate that it is derived
from the original `list`
- add ability to use a "flat" array of values rather than objects and still use
all the same functionality

## License

MIT
