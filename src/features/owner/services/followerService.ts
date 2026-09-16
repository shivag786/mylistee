/** Followers of the signed-in owner's shop — favourites read from the shop's side. */
import { apiClient } from '@/services/apiClient'

export interface Follower {
  id: string
  name: string
  avatarUrl: string | null
  followedAt: string | null
}

export interface FollowerList {
  followers: Follower[]
  total: number
}

export const followerService = {
  list: () => apiClient.get<FollowerList>('business/followers'),
}
