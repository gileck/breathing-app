import type { Exercise } from './types';

const SEED_CREATED_AT = '2026-01-01T00:00:00.000Z';

export const SEED_EXERCISES: Exercise[] = [
    {
        id: 'seed-478',
        name: '4-7-8 Relax',
        pattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
        length: { kind: 'cycles', value: 15 },
        favorite: true,
        createdAt: SEED_CREATED_AT,
        updatedAt: SEED_CREATED_AT,
    },
    {
        id: 'seed-box',
        name: 'Box Breathing',
        pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
        length: { kind: 'cycles', value: 15 },
        favorite: false,
        createdAt: SEED_CREATED_AT,
        updatedAt: SEED_CREATED_AT,
    },
    {
        id: 'seed-coherent',
        name: 'Coherent 5-5',
        pattern: { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
        length: { kind: 'cycles', value: 15 },
        favorite: false,
        createdAt: SEED_CREATED_AT,
        updatedAt: SEED_CREATED_AT,
    },
    {
        id: 'seed-morning',
        name: 'Morning Rise',
        pattern: { inhale: 4, holdIn: 2, exhale: 6, holdOut: 2 },
        length: { kind: 'cycles', value: 12 },
        favorite: false,
        createdAt: SEED_CREATED_AT,
        updatedAt: SEED_CREATED_AT,
    },
];
