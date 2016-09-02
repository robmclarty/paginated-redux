'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// Return a new array, a subset of `list`, which matches `filter`. Assumes an
// array of objects and cyclers through each object, and looks at each property,
// and compares all string properties to the value of the `filter` string,
// returning only those which contain an exact match.
var filteredList = function filteredList() {
  var filter = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
  var list = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  if (filter) {
    return list.filter(function (el) {
      return Object.keys(el).some(function (prop) {
        return el[prop] && typeof el[prop] === 'string' && el[prop].toLowerCase().indexOf(filter.toLowerCase()) >= 0;
      });
    });
  }

  return list;
};

// Return `list` sorted by `prop` in either ascending or decending order based
// on the value of `order` (either 'asc' or 'desc').
var sortedList = function sortedList() {
  var prop = arguments.length <= 0 || arguments[0] === undefined ? 'name' : arguments[0];
  var order = arguments.length <= 1 || arguments[1] === undefined ? 'asc' : arguments[1];
  var list = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  return list.sort(function (compA, compB) {
    var a = compA;
    var b = compB;

    // If a prop is provided to sort by, assume each element is an object with
    // a property called `prop`.
    if (prop) {
      a = compA[prop];
      b = compB[prop];
    }

    if (a > b) return order === 'asc' ? 1 : -1;
    if (a < b) return order === 'asc' ? -1 : 1;

    return 0;
  });
};

// Return a new array that is the reverse of `list`.
var reversedList = function reversedList(list) {
  return list.slice().reverse();
};

// Return the total number of pages that can be made from `list`.
var totalPages = function totalPages() {
  var per = arguments.length <= 0 || arguments[0] === undefined ? 10 : arguments[0];
  var list = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  var total = Math.ceil(list.length / per);

  return total ? total : 0;
};

// Return a slice of all `list` starting at `start` up to `per`
// (or the length of list; whichever comes first).
var slicedList = function slicedList() {
  var page = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
  var per = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];
  var list = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  var start = (page - 1) * per;
  var end = per === 0 ? list.length : start + per;

  return end === list.length ? list.slice(start) : list.slice(start, end);
};

// params:
// 1. the reducer being augmented
// 2. definitions of action types
// 3. options
var paginated = function paginated(reducer) {
  var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var _ref$GOTO_PAGE = _ref.GOTO_PAGE;
  var GOTO_PAGE = _ref$GOTO_PAGE === undefined ? 'GOTO_PAGE' : _ref$GOTO_PAGE;
  var _ref$NEXT_PAGE = _ref.NEXT_PAGE;
  var NEXT_PAGE = _ref$NEXT_PAGE === undefined ? 'NEXT_PAGE' : _ref$NEXT_PAGE;
  var _ref$PREV_PAGE = _ref.PREV_PAGE;
  var PREV_PAGE = _ref$PREV_PAGE === undefined ? 'PREV_PAGE' : _ref$PREV_PAGE;
  var _ref$FILTER = _ref.FILTER;
  var FILTER = _ref$FILTER === undefined ? 'FILTER' : _ref$FILTER;
  var _ref$SORT = _ref.SORT;
  var SORT = _ref$SORT === undefined ? 'SORT' : _ref$SORT;

  var _ref2 = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var _ref2$defaultPage = _ref2.defaultPage;
  var defaultPage = _ref2$defaultPage === undefined ? 1 : _ref2$defaultPage;
  var _ref2$defaultSortOrde = _ref2.defaultSortOrder;
  var defaultSortOrder = _ref2$defaultSortOrde === undefined ? 'asc' : _ref2$defaultSortOrde;
  var _ref2$defaultSortBy = _ref2.defaultSortBy;
  var defaultSortBy = _ref2$defaultSortBy === undefined ? 'name' : _ref2$defaultSortBy;
  var _ref2$defaultPer = _ref2.defaultPer;
  var defaultPer = _ref2$defaultPer === undefined ? 10 : _ref2$defaultPer;
  var _ref2$defaultFilter = _ref2.defaultFilter;
  var defaultFilter = _ref2$defaultFilter === undefined ? '' : _ref2$defaultFilter;
  var _ref2$defaultTotal = _ref2.defaultTotal;
  var defaultTotal = _ref2$defaultTotal === undefined ? 0 : _ref2$defaultTotal;

  // NOTE: the reducer's array is named "list" at this point.
  // TODO: Is there a way to define the name of this property outside this module?
  // NOTE: cacheList is a temporary cached array of sorted + filtered elements
  // from the total list so that it doesn't need to be re-calculated each time
  // the pagedList function is called.
  var initialState = {
    list: reducer(undefined, {}),
    pageList: [],
    cacheList: sortedList(defaultSortBy, defaultSortOrder, filteredList(defaultFilter, reducer(undefined, {}))),
    page: defaultPage,
    total: defaultTotal,
    per: defaultPer,
    order: defaultSortOrder,
    by: defaultSortBy,
    filter: defaultFilter
  };

  return function () {
    var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
    var action = arguments[1];
    var list = state.list;
    var cacheList = state.cacheList;
    var page = state.page;
    var total = state.total;
    var per = state.per;
    var order = state.order;
    var by = state.by;
    var filter = state.filter;

    // NOTE: I'm using blocks (i.e., statments wrapped in {}) for a few
    // conditions so that I can reuse the same variable const in different
    // blocks without causing a duplicate declaration conflicts.

    switch (action.type) {

      // Go to a specific page. Can be used to initialize the list into a certain
      // page state.
      case GOTO_PAGE:
        return _extends({}, state, {
          page: action.page,
          pageList: slicedList(action.page, per, cacheList)
        });

      // If the the action is fired whilst at the end of the list, swing around
      // back to the beginning.
      case NEXT_PAGE:
        var nextPage = page + 1;
        if (nextPage > state.list.length - 1) nextPage = 0;

        return _extends({}, state, {
          page: nextPage,
          pageList: slicedList(nextPage, per, cacheList)
        });

      // If the action is fired whilst already at the beginning of the list,
      // swing around to the end of the list (this behaviour can be handled
      // differently through the UI if this is not the desired behaviour, for
      // example, by simply not presenting the user with the "prev" button at
      // all if already on the first page so it is not possible to wrap around).
      case PREV_PAGE:
        var prevPage = page - 1;
        if (prevPage < 0) prevPage = state.list.length - 1;

        return _extends({}, state, {
          page: prevPage,
          pageList: slicedList(prevPage, per, cacheList)
        });

      // Reset page to 1 as this existing page has lost its meaning due to the
      // list changing form.
      case FILTER:
        {
          var newCache = sortedList(by, order, filteredList(action.filter, list));

          return _extends({}, state, {
            filter: action.filter,
            cacheList: newCache,
            pageList: slicedList(1, per, newCache)
          });
        }

      // There's a bit of optimization going on here. If the `by` hasn't changed
      // (meaning the user clicked on the currently active column), then simply
      // reverse the order of the cacheList (which is cheaper than running through
      // the entire filter and sort functions). If the `by` has changed, *then*
      // run the cacheList through the whole sort/filter combo to get a new list.
      case SORT:
        {
          var newOrder = action.by === by && order === 'asc' ? 'desc' : 'asc';
          var _newCache = action.by === by ? reversedList(cacheList) : sortedList(action.by, newOrder, filteredList(filter, list));

          return _extends({}, state, {
            by: action.by,
            order: newOrder,
            cacheList: _newCache,
            pageList: slicedList(page, per, _newCache)
          });
        }

      // Setup the default list and cache and calculate the total.
      default:
        {
          var newList = reducer(state.list, action);
          var _newCache2 = sortedList(by, order, filteredList(filter, newList));

          return _extends({}, state, {
            list: newList,
            cacheList: _newCache2,
            pageList: slicedList(page, per, cacheList),
            total: totalPages(per, _newCache2)
          });
        }}
  };
};

exports.default = paginated;