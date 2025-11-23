import { TypedSupabaseClient } from '@/lib/types'

export function fetchAllQuestionsQuery(client: TypedSupabaseClient) {
  return client
    .from('questions')
    .select('*')
    .throwOnError()
}
