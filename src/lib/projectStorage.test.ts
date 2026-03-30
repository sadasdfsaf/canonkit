import { describe, expect, it } from 'vitest'

import { sampleProject } from '../data/sampleProject'
import {
  CANONKIT_PROJECT_STORAGE_KEY,
  clearStoredProject,
  isStoryProject,
  loadProjectFromStorage,
  parseProjectJson,
  saveProjectToStorage,
} from './projectStorage'

const createStorage = (initialValue?: string) => {
  const store = new Map<string, string>()

  if (initialValue !== undefined) {
    store.set(CANONKIT_PROJECT_STORAGE_KEY, initialValue)
  }

  return {
    getItem(key: string) {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
  }
}

describe('projectStorage', () => {
  it('accepts the bundled sample project format', () => {
    expect(isStoryProject(sampleProject)).toBe(true)
  })

  it('parses a valid CanonKit project JSON payload', () => {
    const project = parseProjectJson(JSON.stringify(sampleProject))

    expect(project.name).toBe(sampleProject.name)
    expect(project.scenes).toHaveLength(sampleProject.scenes.length)
  })

  it('rejects malformed JSON payloads', () => {
    expect(() => parseProjectJson('{not-json}')).toThrow(
      'Import failed: the selected file is not valid JSON.',
    )
  })

  it('rejects JSON payloads that do not match the project schema', () => {
    expect(() =>
      parseProjectJson(JSON.stringify({ id: 'bad-project', name: 'Bad Project' })),
    ).toThrow(
      'Import failed: the JSON does not match the CanonKit story project format.',
    )
  })

  it('loads from browser storage when a valid saved project exists', () => {
    const storage = createStorage(JSON.stringify(sampleProject))
    const result = loadProjectFromStorage(storage, sampleProject)

    expect(result.source).toBe('localStorage')
    expect(result.project.id).toBe(sampleProject.id)
  })

  it('falls back to the sample project when saved browser data is invalid', () => {
    const storage = createStorage('{bad-json}')
    const result = loadProjectFromStorage(storage, sampleProject)

    expect(result.source).toBe('sample')
    expect(result.project.id).toBe(sampleProject.id)
    expect(result.error).toContain('Reverted to the bundled sample project.')
  })

  it('saves and clears browser project data', () => {
    const storage = createStorage()

    expect(saveProjectToStorage(storage, sampleProject)).toEqual({ ok: true })
    expect(storage.getItem(CANONKIT_PROJECT_STORAGE_KEY)).not.toBeNull()

    clearStoredProject(storage)
    expect(storage.getItem(CANONKIT_PROJECT_STORAGE_KEY)).toBeNull()
  })
})
