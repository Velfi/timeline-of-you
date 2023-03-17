import { VALID_TAG_NAME_REGEX } from './tag';

describe('isValidTagName', () => {
  it('should return true for valid names', () => {
    const validTags = ['foo', 'foo-bar', 'foo_bar', 'foo_bar-baz', '{foo}', '[foo]', '(foo)'];

    validTags.forEach((tag) => {
      expect(tag).toMatch(VALID_TAG_NAME_REGEX);
    });
  });

  it('should return false for invalid names', () => {
    const invalidTags = ['', 'foo bar', '#tag', "!@#$%^&*|'\""];

    invalidTags.forEach((tag) => {
      expect(tag).not.toMatch(VALID_TAG_NAME_REGEX);
    });
  });
});
