import React from 'react';
import { Grid, Heart, MessageCircle, MoreHorizontal, User, Plus } from 'lucide-react';
import PhoneMockup from './PhoneMockup';
import TemplateRenderer from './TemplateRenderer';

const DEFAULT_BRAND = {
  brandName: 'Kreavia',
  brandArchetype: 'The Visionary',
  brandVoice: 'Creating premium aesthetics.',
  colors: { primary: '#1A1A1A', accent: '#C6A96B', highlight: '#F5F5F7', secondary: '#FBFBFD' },
  typography: { headline: 'Playfair Display', body: 'Inter', ui: 'Satoshi' },
  logos: [],
};

const SocialFeedPreview = ({ brandData: rawBrand }) => {
  const brandData = rawBrand || DEFAULT_BRAND;

  const brandColor = brandData?.colors?.accent || '#C6A96B';
  const brandName = brandData?.brandName || 'Brand';
  const logoUrl = brandData?.logos?.[0]?.url || `https://placehold.co/100x100/111/${(brandColor || '#C6A96B').replace('#','')}/?text=${brandName[0]}`;

  const demoPosts = [
    { type: 'quote', text: `Consistency is the playground of brilliance.`, layout: 'centered' },
    { type: 'reel_cover', text: `THE NEW ERA OF BRANDING`, layout: 'bold' },
    { type: 'carousel', text: `3 Ways to Scale Your Influence`, layout: 'minimal' },
    { type: 'quote', text: `Luxury is a state of mind.`, layout: 'minimal' },
    { type: 'story', text: `Behind the Scenes`, layout: 'centered' },
    { type: 'reel_cover', text: `DREAM BIG. CREATE MORE.`, layout: 'centered' },
    { type: 'carousel', text: `Mastering Your Archetype`, layout: 'bold' },
    { type: 'quote', text: `Stay curious. Stay creative.`, layout: 'centered' },
    { type: 'story', text: `Q&A Session`, layout: 'centered' },
  ];

  const hybridPosts = brandData.hybridContent?.map((item, idx) => ({
    type: 'quote',
    text: item.caption,
    tagline: item.tagline,
    imageUrl: item.imageUrl,
    layout: 'bold'
  })) || [];

  const posts = hybridPosts.length > 0 ? hybridPosts : (brandData.contentIdeas?.map((idea, idx) => {
    let type = 'quote';
    if (idea.format === 'reel') type = 'reel_cover';
    else if (idea.format === 'story') type = 'story';
    else if (idea.format === 'carousel') type = 'carousel';
    else if (idx % 3 === 0) type = 'educational';

    const layouts = ['centered', 'minimal', 'bold'];
    return {
      type,
      text: idea.title,
      layout: layouts[idx % layouts.length]
    };
  }) || demoPosts);

  return (
    <div className="flex flex-col gap-8 items-center lg:items-start w-full">
      <div className="mb-4">
        <h3 className="text-3xl font-headline mb-2 text-primary font-bold text-center lg:text-left">Social Identity</h3>
        <p className="text-muted text-sm max-w-md font-medium text-center lg:text-left">See how your brand's DNA translates into a cohesive social media presence.</p>
      </div>

      <PhoneMockup>
        <div className="bg-surface text-primary h-full flex flex-col font-ui rounded-[3rem] overflow-hidden border border-light shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 pt-10 border-b border-light shrink-0 bg-surface/90 backdrop-blur-md sticky top-0 z-10">
            <span className="font-bold text-sm tracking-tight text-primary/80">{brandName.toLowerCase().replace(/\s+/g, '')}.official</span>
            <div className="flex items-center gap-4">
              <Plus className="w-5 h-5 text-primary" />
              <MoreHorizontal className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Profile Section */}
          <div className="px-6 py-6 flex flex-col gap-5 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-accent/20 via-accent to-accent/20">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <img src={logoUrl} className="w-full h-full rounded-full object-cover shadow-sm bg-highlight/50" alt="Profile" />
                </div>
              </div>
              <div className="flex-1 flex justify-around text-center">
                <div><div className="font-bold text-sm text-primary">12</div><div className="text-[10px] text-muted font-bold">Posts</div></div>
                <div><div className="font-bold text-sm text-primary">8.4k</div><div className="text-[10px] text-muted font-bold">Followers</div></div>
                <div><div className="font-bold text-sm text-primary">1.2k</div><div className="text-[10px] text-muted font-bold">Following</div></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm text-primary leading-none">{brandData?.brandArchetype || 'Visionary'}</span>
              <p className="text-xs text-muted leading-relaxed font-medium">
                {brandData?.brandVoice || 'Creating premium aesthetics.'} ✨ 
                <br/>
                <span className="text-accent">#brandidentity #creation</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-secondary py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all">Edit Profile</button>
              <button className="flex-1 bg-highlight/50 text-primary py-2 rounded-xl text-xs font-bold border border-light hover:bg-highlight transition-all">Insights</button>
            </div>

            {/* Highlights */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 shrink-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                  <div 
                    className="w-14 h-14 rounded-full border border-light flex items-center justify-center overflow-hidden bg-white shadow-sm"
                    style={{ border: `2px solid ${brandColor}22` }}
                  >
                     <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                        <TemplateRenderer type="story" brandData={brandData} text="" />
                     </div>
                  </div>
                  <span className="text-[10px] font-bold text-muted">Core {i}</span>
                </div>
              ))}
            </div>

            {/* Feed Tabs */}
            <div className="flex border-t border-light mt-2 shrink-0">
              <div className="flex-1 flex justify-center py-3 border-b-2 border-primary">
                <Grid className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 flex justify-center py-3 opacity-20">
                <User className="w-5 h-5 text-muted" />
              </div>
            </div>

            {/* Feed Grid */}
            <div className="grid grid-cols-3 gap-0.5 bg-light/30">
              {posts.slice(0, 9).map((post, i) => (
                <div 
                  key={i} 
                  className="aspect-square relative group overflow-hidden bg-highlight/20"
                >
                   <div className="w-full h-full scale-[0.6] origin-center">
                      <TemplateRenderer 
                        type={post.type} 
                        brandData={brandData} 
                        text={post.text} 
                        layout={post.layout} 
                      />
                   </div>
                   <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="flex gap-3 text-secondary">
                         <div className="flex items-center gap-1 font-bold text-xs"><Heart size={14} fill="currentColor" /> 1.2k</div>
                         <div className="flex items-center gap-1 font-bold text-xs"><MessageCircle size={14} fill="currentColor" /> 48</div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PhoneMockup>
    </div>
  );
};

export default SocialFeedPreview;
