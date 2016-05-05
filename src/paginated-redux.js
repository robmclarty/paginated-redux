// Return a new array, a subset of `list`, which matches `filter`. Assumes an
// array of objects and cyclers through each object, and looks at each property,
// and compares all string properties to the value of the `filter` string,
// returning only those which contain an exact match.
const filteredList = (filter = '', list = []) => {
  if (filter) {
    return list.filter((el) => {
      return Object.keys(el).some((prop) => {
        return el[prop] &&
          typeof el[prop] === 'string' &&
          el[prop].toLowerCase().indexOf(filter.toLowerCase()) >= 0;
      });
    });
  }

  return list;
};

// Return `list` sorted by `prop` in either ascending or decending order based
// on the value of `order` (either 'asc' or 'desc').
const sortedList = (prop = 'name', order = 'asc', list = []) => {
  return list.sort((compA, compB) => {
    let a = compA;
    let b = compB;

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
const reversedList = list => {
  return list.slice().reverse();
}

// Return the total number of pages that can be made from `list`.
const totalPages = (per = 10, list = []) => {
  const total = Math.ceil(list.length / per);

  return total ? total : 0;
};

// Return a slice of all `list` starting at `start` up to `per`
// (or the length of list; whichever comes first).
const slicedList = (page = 1, per = 10, list = []) => {
  const start = (page - 1) * per;
  const end = per === 0 ? list.length : start + per;

  return end === list.length ?
    list.slice(start) :
    list.slice(start, end);
};

// params:
// 1. the reducer being augmented
// 2. definitions of action types
// 3. options
const paginated = (
  reducer,
  {
    GOTO_PAGE = 'GOTO_PAGE',
    NEXT_PAGE = 'NEXT_PAGE',
    PREV_PAGE = 'PREV_PAGE',
    FILTER = 'FILTER',
    SORT = 'SORT'
  } = {},
  {
    defaultPage = 1,
    defaultSortOrder = 'asc',
    defaultSortBy = 'name',
    defaultPer = 10,
    defaultFilter = '',
    defaultTotal = 0
  } = {}
) => {
  // NOTE: the reducer's array is named "list" at this point.
  // TODO: Is there a way to define the name of this property outside this module?
  // NOTE: cacheList is a temporary cached array of sorted + filtered elements
  // from the total list so that it doesn't need to be re-calculated each time
  // the pagedList function is called.
  const initialState = {
    list: reducer(undefined, {}),
    pageList: [],
    cacheList: sortedList(defaultSortBy, defaultSortOrder,
      filteredList(defaultFilter, reducer(undefined, {}))),
    page: defaultPage,
    total: defaultTotal,
    per: defaultPer,
    order: defaultSortOrder,
    by: defaultSortBy,
    filter: defaultFilter
  };

  return (state = initialState, action) => {
    const { list, cacheList, page, total, per, order, by, filter } = state;

    // NOTE: I'm using blocks (i.e., statments wrapped in {}) for a few
    // conditions so that I can reuse the same variable const in different
    // blocks without causing a duplicate declaration conflicts.
    switch (action.type) {

    // Go to a specific page. Can be used to initialize the list into a certain
    // page state.
    case GOTO_PAGE:
      return {
        ...state,
        page: action.page,
        pageList: slicedList(action.page, per, cacheList)
      };

    // If the the action is fired whilst at the end of the list, swing around
    // back to the beginning.
    case NEXT_PAGE:
      let nextPage = page + 1;
      if (nextPage > state.list.length - 1) nextPage = 0;

      return {
        ...state,
        page: nextPage,
        pageList: slicedList(nextPage, per, cacheList)
      };

    // If the action is fired whilst already at the beginning of the list,
    // swing around to the end of the list (this behaviour can be handled
    // differently through the UI if this is not the desired behaviour, for
    // example, by simply not presenting the user with the "prev" button at
    // all if already on the first page so it is not possible to wrap around).
    case PREV_PAGE:
      let prevPage = page - 1;
      if (prevPage < 0) prevPage = state.list.length - 1;

      return {
        ...state,
        page: prevPage,
        pageList: slicedList(prevPage, per, cacheList)
      };

    // Reset page to 1 as this existing page has lost its meaning due to the
    // list changing form.
    case FILTER: {
      const newCache = sortedList(by, order, filteredList(action.filter, list));

      return {
        ...state,
        filter: action.filter,
        cacheList: newCache,
        pageList: slicedList(1, per, newCache)
      };
    }

    // There's a bit of optimization going on here. If the `by` hasn't changed
    // (meaning the user clicked on the currently active column), then simply
    // reverse the order of the cacheList (which is cheaper than running through
    // the entire filter and sort functions). If the `by` has changed, *then*
    // run the cacheList through the whole sort/filter combo to get a new list.
    case SORT: {
      const newOrder = action.by === by && order === 'asc' ? 'desc' : 'asc';
      const newCache = action.by === by ?
        reversedList(cacheList) :
        sortedList(action.by, newOrder, filteredList(filter, list));

      return {
        ...state,
        by: action.by,
        order: newOrder,
        cacheList: newCache,
        pageList: slicedList(page, per, newCache)
      };
    }

    // Setup the default list and cache and calculate the total.
    default: {
      const newList = reducer(state.list, action);
      const newCache = sortedList(by, order, filteredList(filter, newList));

      return {
        ...state,
        list: newList,
        cacheList: newCache,
        pageList: slicedList(page, per, cacheList),
        total: totalPages(per, newCache)
      };
    }}
  };
};

export default paginated;
