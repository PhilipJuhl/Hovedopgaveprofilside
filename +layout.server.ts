import findClaimedGameProfilesByUserIds from '$lib/queries/game-profiles/findClaimedByUserIds';
import upsertAndGetGameProfile from '$lib/queries/game-profiles/upsertAndGet';
import getUser from '$lib/queries/users/get';
import type { LeagueOfLegendsPlayerCardProfile } from '$lib/types/league-of-legends/LeagueOfLegendsPlayerCardProfile';
import type { ValorantPlayerCardProfile } from '$lib/types/valorant/ValorantPlayerCardProfile';
import type { LeagueOfLegendsProfile, User, ValorantProfile } from '@shared/database/schemas/types';
import { userSettingsValidator } from '@shared/database/zod/users/update.validator';
import { VALORANT } from '@shared/enum/gameTitles';
import { LEAGUE_OF_LEGENDS } from '@shared/enum/gameTitles';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';
import type { LayoutServerLoad } from './$types';

const leagueOfLegendsFields: (keyof LeagueOfLegendsProfile)[] = [
  'id',
  'name',
  'tag',
  'level',
  'puuid',
  'iconId',
  'regionId',
  'soloRank',
  'soloTier',
  'flexRank',
  'flexTier',
  'createdAt',
  'flexPoints',
  'soloPoints',
  'updatedAt',
];
const valorantFields: (keyof ValorantProfile)[] = [
  'id',
  'name',
  'tag',
  'level',
  'card',
  'title',
  'rank',
  'server',
  'createdAt',
  'updatedAt',
];
const userFields: (keyof User)[] = [
  'id',
  'fullName',
  'displayName',
  'email',
  'gender',
  'avatar',
  'country',
  'birthday',
  'createdAt',
  'updatedAt',
  'role',
  'discordId',
  'description',
  'skills',
];
export const load: LayoutServerLoad = async ({ fetch, params, parent }) => {
  const { userId } = params;
  const { me } = await parent();

  const user = await getUser(userId, { fields: userFields }, { fetch });

  // Get claimed profiles for both games in a single request
  const claimedProfiles = await findClaimedGameProfilesByUserIds(
    {
      fields: ['id', 'profileType'],
      userIds: [user.id],
      games: [LEAGUE_OF_LEGENDS, VALORANT],
    },
    { fetch },
  );

  // Group profiles by game type
  const profilesByGame = {
    [VALORANT]: claimedProfiles.filter((profile) => profile.profileType === VALORANT),
    [LEAGUE_OF_LEGENDS]: claimedProfiles.filter((profile) => profile.profileType === LEAGUE_OF_LEGENDS),
  };

  // Fetch game profiles in parallel
  // TODO: Type this properly in both frontend and backend
  const [valorantProfiles, leagueOfLegendsProfiles] = await Promise.all([
    Promise.all(
      //@ts-ignore: gameProfile is not properly typed
      profilesByGame[VALORANT].map(({ gameName, tag, server }) =>
        //@ts-ignore: gameProfile is not properly typed
        upsertAndGetGameProfile(VALORANT, server, `${gameName}-${tag}`, valorantFields, { fetch }),
      ),
    ),
    Promise.all(
      //@ts-ignore: gameProfile is not properly typed
      profilesByGame[LEAGUE_OF_LEGENDS].map(({ gameName, tag, server }) =>
        //@ts-ignore: gameProfile is not properly typed
        upsertAndGetGameProfile(LEAGUE_OF_LEGENDS, server, `${gameName}-${tag}`, leagueOfLegendsFields, { fetch }),
      ),
    ),
  ]);
  const form = await superValidate(user, zod(userSettingsValidator));

  return {
    user,
    valorantProfiles: (valorantProfiles as ValorantPlayerCardProfile[]) || [],
    leagueOfLegendsProfiles: (leagueOfLegendsProfiles as LeagueOfLegendsPlayerCardProfile[]) || [],
    isViewingOwnProfile: userId === me?.id,
    form,
  };
};
