import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertLayoutRequestDto } from '@/modules/cv/dto/request/upsert-layout.request.dto';

async function errorsFor(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(UpsertLayoutRequestDto, payload);
  const errors = await validate(dto as object);
  return errors.map(e => e.property);
}

const validPayload = {
  mainOrder: ['summary', 'experience', 'projects'],
  sideOrder: ['skills', 'education'],
  hidden: ['certifications'],
  titles: { experience: 'Work History' },
};

describe('UpsertLayoutRequestDto', () => {
  it('accepts a well-formed layout', async () => {
    expect(await errorsFor(validPayload)).toEqual([]);
  });

  it('accepts opaque custom-section ids as keys (no enum coupling)', async () => {
    const errors = await errorsFor({
      ...validPayload,
      mainOrder: ['019abc12-3456-7890-abcd-ef0123456789', 'summary'],
    });
    expect(errors).toEqual([]);
  });

  it('accepts empty arrays and an empty titles object', async () => {
    expect(
      await errorsFor({
        mainOrder: [],
        sideOrder: [],
        hidden: [],
        titles: {},
      }),
    ).toEqual([]);
  });

  describe('order arrays', () => {
    it('rejects a non-array order field', async () => {
      expect(
        await errorsFor({ ...validPayload, mainOrder: 'summary' }),
      ).toContain('mainOrder');
    });

    it('rejects non-string array items', async () => {
      expect(await errorsFor({ ...validPayload, sideOrder: [1, 2] })).toContain(
        'sideOrder',
      );
    });

    it('rejects empty-string keys', async () => {
      expect(await errorsFor({ ...validPayload, hidden: [''] })).toContain(
        'hidden',
      );
    });

    it('rejects a key longer than 100 chars', async () => {
      expect(
        await errorsFor({ ...validPayload, mainOrder: ['a'.repeat(101)] }),
      ).toContain('mainOrder');
    });

    it('rejects more than 50 keys', async () => {
      expect(
        await errorsFor({
          ...validPayload,
          mainOrder: Array.from({ length: 51 }, (_, i) => `k${i}`),
        }),
      ).toContain('mainOrder');
    });
  });

  describe('titles', () => {
    it('rejects a non-object titles', async () => {
      expect(await errorsFor({ ...validPayload, titles: [] })).toContain(
        'titles',
      );
    });

    it('rejects a non-string title value', async () => {
      expect(
        await errorsFor({ ...validPayload, titles: { experience: 42 } }),
      ).toContain('titles');
    });

    it('rejects a title longer than 120 chars', async () => {
      expect(
        await errorsFor({
          ...validPayload,
          titles: { experience: 'x'.repeat(121) },
        }),
      ).toContain('titles');
    });

    it('rejects more than 50 title entries', async () => {
      const titles: Record<string, string> = {};
      for (let i = 0; i < 51; i++) titles[`k${i}`] = 'T';
      expect(await errorsFor({ ...validPayload, titles })).toContain('titles');
    });
  });
});
