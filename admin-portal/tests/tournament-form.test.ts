import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TournamentForm, {
  validateTournament,
  type TournamentFormValues
} from '$lib/components/forms/TournamentForm.svelte';

function values(overrides: Partial<TournamentFormValues> = {}): TournamentFormValues {
  return {
    name: 'Summer Cup',
    description: '',
    startDate: '2024-06-10',
    endDate: '2024-06-20',
    venue: 'Main Ground',
    status: 'upcoming',
    visibility: 'public',
    ...overrides
  };
}

describe('validateTournament (pure)', () => {
  it('returns no errors for valid values', () => {
    expect(validateTournament(values())).toEqual({});
  });

  it('flags endDate when endDate < startDate', () => {
    const errors = validateTournament(
      values({ startDate: '2024-06-20', endDate: '2024-06-10' })
    );
    expect(errors.endDate).toBeTruthy();
    expect(errors.endDate).toMatch(/on or after/i);
  });

  it('accepts endDate equal to startDate', () => {
    const errors = validateTournament(
      values({ startDate: '2024-06-10', endDate: '2024-06-10' })
    );
    expect(errors.endDate).toBeUndefined();
  });

  it('requires the name field', () => {
    expect(validateTournament(values({ name: '   ' })).name).toBeTruthy();
  });
});

describe('TournamentForm submission', () => {
  it('does not call onSubmit and shows an inline error when endDate < startDate', async () => {
    const onSubmit = vi.fn();
    const { container, getAllByRole } = render(TournamentForm, {
      props: {
        initial: {
          name: 'Winter Cup',
          description: '',
          startDate: '2024-06-20',
          endDate: '2024-06-10',
          venue: 'Main Ground',
          status: 'upcoming',
          visibility: 'public'
        },
        onSubmit
      }
    });

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    await fireEvent.submit(form!);

    // The repository (via onSubmit) is never called for an invalid range.
    expect(onSubmit).not.toHaveBeenCalled();

    // An inline error is shown.
    const alerts = getAllByRole('alert');
    expect(alerts.some((el) => /on or after/i.test(el.textContent ?? ''))).toBe(true);
  });

  it('calls onSubmit with the values when the range is valid', async () => {
    const onSubmit = vi.fn();
    const { container } = render(TournamentForm, {
      props: {
        initial: {
          name: 'Spring Cup',
          description: '',
          startDate: '2024-06-10',
          endDate: '2024-06-20',
          venue: 'Main Ground',
          status: 'upcoming',
          visibility: 'public'
        },
        onSubmit
      }
    });

    await fireEvent.submit(container.querySelector('form')!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

// ── Property-based tests ──────────────────────────────────────────────────────
import fc from 'fast-check';

/** Formats a Date as an ISO "YYYY-MM-DD" date string. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

describe('validateTournament — properties', () => {
  // Feature: kot-fc-admin-portal, Property 14: Tournament forms with invalid dates are rejected
  // **Validates: Requirements 11.3, 11.4**
  it('always flags an endDate error when endDate is strictly before startDate', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01') }),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01') }),
        (a, b) => {
          const startIso = isoDate(a);
          const endIso = isoDate(b);
          // Only exercise the invalid case: end strictly before start.
          fc.pre(endIso < startIso);
          const errors = validateTournament(
            values({ startDate: startIso, endDate: endIso })
          );
          expect(errors.endDate).toBeTruthy();
          expect(errors.endDate).toMatch(/on or after/i);
        }
      )
    );
  });
});

describe('TournamentForm submission — properties', () => {
  // Feature: kot-fc-admin-portal, Property 14: Tournament forms with invalid dates are rejected
  // **Validates: Requirements 11.3, 11.4**
  it('never invokes onSubmit when endDate is strictly before startDate', async () => {
    // fast-check drives distinct date pairs; each renders a fresh form.
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01') }),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01') }),
        async (a, b) => {
          const startIso = isoDate(a);
          const endIso = isoDate(b);
          fc.pre(endIso < startIso);

          const onSubmit = vi.fn();
          const { container, unmount } = render(TournamentForm, {
            props: {
              initial: {
                name: 'Cup',
                description: '',
                startDate: startIso,
                endDate: endIso,
                venue: 'Ground',
                status: 'upcoming',
                visibility: 'public'
              },
              onSubmit
            }
          });

          try {
            await fireEvent.submit(container.querySelector('form')!);
            expect(onSubmit).not.toHaveBeenCalled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 25 }
    );
  });
});
