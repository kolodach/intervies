import { TypedSupabaseClient } from '@/lib/types'

export function fetchAllQuestionsQuery(client: TypedSupabaseClient) {
  return client
    .from('questions')
    .select('*')
    .throwOnError()
}

export function fetchQuestionById(client: TypedSupabaseClient, id: string) {
  return client
    .from('questions')
    .select('*')
    .eq('id', id)
    .throwOnError()
    .single()
}
