import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContext } from './request-context';

const contextStorage = new AsyncLocalStorage<RequestContext>();

export default contextStorage;
