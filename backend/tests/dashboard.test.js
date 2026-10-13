const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const Conversation = require('../models/Conversation');
const { getUnreadCount } = require('../controllers/chatController');

// Dashboard energy statistics are static UI data. Its live backend dependency
// is the chat unread badge. Model methods are mocked: no DB or server starts.
afterEach(() => mock.restoreAll());
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('dashboard badge totals only the requesting member unread counts', async () => {
  const find = mock.method(Conversation, 'find', async (query) => {
    assert.deepEqual(query, { participants: 'member' });
    return [
      { unreadCounts: new Map([['member', 2], ['other', 99]]) },
      { unreadCounts: new Map([['member', 3]]) },
      { unreadCounts: new Map([['other', 10]]) }, {},
    ];
  });
  const res = response();
  await getUnreadCount({ user: { id: 'member' } }, res);
  assert.deepEqual(res.body, { success: true, totalUnread: 5 });
  assert.equal(find.mock.callCount(), 1);
});

test('dashboard badge is zero without conversations', async () => {
  mock.method(Conversation, 'find', async () => []);
  const res = response();
  await getUnreadCount({ user: { id: 'member' } }, res);
  assert.deepEqual(res.body, { success: true, totalUnread: 0 });
});

test('unread query failure returns 500 and a safe zero count', async () => {
  mock.method(Conversation, 'find', async () => { throw new Error('DB offline'); });
  mock.method(console, 'error', () => {});
  const res = response();
  await getUnreadCount({ user: { id: 'member' } }, res);
  assert.equal(res.code, 500);
  assert.deepEqual(res.body, { success: false, totalUnread: 0 });
});
