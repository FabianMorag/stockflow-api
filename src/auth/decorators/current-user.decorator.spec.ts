import { CurrentUser, JwtUserPayload } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
    expect(typeof CurrentUser).toBe('function');
  });

  it('should be callable without arguments', () => {
    expect(() => CurrentUser()).not.toThrow();
  });
});

describe('JwtUserPayload interface', () => {
  it('should accept valid payload shape', () => {
    const payload: JwtUserPayload = {
      sub: 'user-123',
      email: 'test@test.com',
      role: 'TRADER',
    };

    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('test@test.com');
  });
});
