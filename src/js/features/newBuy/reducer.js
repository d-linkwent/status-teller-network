import {SET_CONTACT_INFO, SET_TRADE, SET_OFFER_ID, RESET_NEW_BUY} from './constants';
import {RESET_STATE, PURGE_STATE} from "../network/constants";

const DEFAULT_STATE = {
  currencyQuantity: 0,
  assetQuantity: 0
};

function reducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case SET_OFFER_ID:
      return {
        ...state, offerId: parseInt(action.offerId, 10)
      };
    case SET_CONTACT_INFO:
      return {
        ...state,
        username: action.username,
        statusContactCode: action.statusContactCode
      };
    case SET_TRADE:
      return {
        ...state,
        currencyQuantity: action.currencyQuantity,
        assetQuantity: action.assetQuantity,
        price: action.price
      };
    case RESET_NEW_BUY:
    case PURGE_STATE:
    case RESET_STATE: {
      return DEFAULT_STATE;
    }
    default:
      return state;
  }
}

export default reducer;
