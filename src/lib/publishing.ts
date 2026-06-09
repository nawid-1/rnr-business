// Jaettu julkaisulogiikka — käytetään sekä marketing API:ssa että cron-jobissa

export type PostRow = {
  id: string;
  platform: string;
  content: string;
  image_url: string | null;
};

export type AccountRow = {
  platform: string;
  account_id: string;
  page_id: string | null;
  access_token: string;
};

export async function publishToPlatform(
  post: PostRow,
  account: AccountRow
): Promise<{ id: string }> {
  if (post.platform === "facebook") return publishFacebook(post, account);
  if (post.platform === "instagram") return publishInstagram(post, account);
  throw new Error(`Tuntematon alusta: ${post.platform}`);
}

async function publishFacebook(
  post: PostRow,
  account: AccountRow
): Promise<{ id: string }> {
  const pageId = account.page_id || account.account_id;
  const token = account.access_token;

  if (post.image_url) {
    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: post.image_url,
        caption: post.content,
        access_token: token,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return { id: data.post_id || data.id };
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: post.content, access_token: token }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id };
}

async function publishInstagram(
  post: PostRow,
  account: AccountRow
): Promise<{ id: string }> {
  if (!post.image_url) {
    throw new Error("Instagram vaatii kuvan. Lisää kuvan URL postaukseen.");
  }
  const igId = account.account_id;
  const token = account.access_token;

  const createRes = await fetch(`https://graph.instagram.com/v21.0/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: post.image_url,
      caption: post.content,
      access_token: token,
    }),
  });
  const createData = await createRes.json();
  if (createData.error) throw new Error(createData.error.message);

  const publishRes = await fetch(
    `https://graph.instagram.com/v21.0/${igId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: token,
      }),
    }
  );
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message);
  return { id: publishData.id };
}
