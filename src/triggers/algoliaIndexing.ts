import * as functions from 'firebase-functions';
import algoliasearch from 'algoliasearch';
import { createIndex } from '../common/services/create.index';

const ALGOLIA_ID = functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key;
// const ALGOLIA_SEARCH_KEY = functions.config().algolia.search_key;
const ALGOLIA_INDEX_NAME = functions.config().algolia.index_name;

const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

export const createAlgoliaIndex = functions.firestore
  .document('/Traders/{traderId}')
  .onCreate(async (snap, _) => {
    // This is not necessary in the current implementation,
    // as the status cannot be public on create.
    // In case of automation this might be necessary.
    const trader = await createIndex(snap);
    if (trader && trader.status === 'PUBLIC') {
      return index.saveObject(trader);
    }
    else {
      console.log('Undefined trader');
      return null;
    }
  });

export const updateAlgoliaIndex = functions.firestore
  .document('/Traders/{traderId}')
  .onUpdate(async (snap, _) => {
    let trader: any;
    trader = await createIndex(snap.after);
    const b_trader = snap.before.data();
    if (trader && trader.status === 'PUBLIC') {
      // Add an 'objectID' field which Algolia requires
      return index.saveObject(trader);
    }
    // Delete index if status gets changed
    else if (trader && b_trader && trader.status !== 'PUBLIC' && b_trader.status === 'PUBLIC') {
      index.deleteObject(snap.after.id)
      return null;
    }
    else {
      console.log('Undefined trader');
      return null;
    }
  });

export const deleteAlgoliaIndex = functions.firestore
  .document('/Traders/{traderId}')
  .onDelete(async (snap, _) => index.deleteObject(snap.id));
