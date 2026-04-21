import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dsbrkqtjedbpyidhndpk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_FS9TA925h_tM_jBUsWQNtQ_1Y_XsvW5'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
