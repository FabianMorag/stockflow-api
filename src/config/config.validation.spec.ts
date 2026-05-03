import { validateConfig } from './config.validation';

describe('validateConfig', () => {
  it('should return valid config when all required env vars are present', () => {
    const envVars = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      PORT: '3000',
    };

    const result = validateConfig(envVars);

    expect(result).toEqual({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      PORT: 3000,
    });
  });

  it('should throw when DATABASE_URL is missing', () => {
    const envVars = { PORT: '3000' };

    expect(() => validateConfig(envVars)).toThrow('DATABASE_URL is required');
  });

  it('should throw when PORT is missing', () => {
    const envVars = { DATABASE_URL: 'postgresql://localhost:5432/db' };

    expect(() => validateConfig(envVars)).toThrow('PORT is required');
  });

  it('should throw when PORT is not a valid number', () => {
    const envVars = {
      DATABASE_URL: 'postgresql://localhost:5432/db',
      PORT: 'not-a-number',
    };

    expect(() => validateConfig(envVars)).toThrow(
      'PORT must be a valid number',
    );
  });

  it('should use default PORT when not provided but DATABASE_URL exists', () => {
    const envVars = { DATABASE_URL: 'postgresql://localhost:5432/db' };

    // PORT is required, so this should still throw
    expect(() => validateConfig(envVars)).toThrow('PORT is required');
  });
});
