import { describe, expect, it } from 'vitest';
import {
  validateCustomListIds,
  validateListColor,
  validateListDescription,
  validateListEntityType,
  validateListIcon,
  validateListName,
  validateListTags,
} from './listValidation';

describe('listValidation (UT-01)', () => {
  it('validates entity type, name, and description', () => {
    expect(validateListEntityType('series')).toBe('series');
    expect(validateListEntityType('person')).toBe('person');
    expect(() => validateListEntityType('movie')).toThrow('lists.invalidEntityType');
    expect(validateListName('  Weekend Sci-Fi  ')).toBe('Weekend Sci-Fi');
    expect(() => validateListName('')).toThrow('lists.invalidName');
    expect(() => validateListName('a'.repeat(61))).toThrow('lists.invalidName');
    expect(() => validateListName('Want to Watch')).toThrow('lists.nameTaken');
    expect(() => validateListName('Assistindo')).toThrow('lists.nameTaken');
    expect(validateListDescription('   ')).toBeNull();
    expect(validateListDescription('  Great shows  ')).toBe('Great shows');
    expect(() => validateListDescription('a'.repeat(241))).toThrow('lists.descriptionTooLong');
  });

  it('validates curated icon, color, tags, and customListIds', () => {
    expect(validateListIcon('rocket')).toBe('rocket');
    expect(() => validateListIcon('unknown')).toThrow('lists.invalidIcon');
    expect(validateListColor('cyan')).toBe('cyan');
    expect(() => validateListColor('#ff00ff')).toThrow('lists.invalidColor');
    expect(validateListTags([' Sci-Fi ', 'sci-fi', 'Drama'])).toEqual(['Sci-Fi', 'Drama']);
    expect(() => validateListTags('sci-fi')).toThrow('lists.invalidTags');
    expect(() => validateListTags([''])).toThrow('lists.invalidTags');
    expect(() => validateListTags(['a'.repeat(25)])).toThrow('lists.tagTooLong');
    expect(() => validateListTags(Array.from({ length: 11 }, (_, i) => `t${i}`))).toThrow('lists.tooManyTags');
    expect(validateCustomListIds(['id-1', 'id-1', ' id-2 '])).toEqual(['id-1', 'id-2']);
    expect(() => validateCustomListIds([''])).toThrow('lists.invalidListIds');
  });
});
