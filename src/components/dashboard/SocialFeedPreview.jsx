import React from 'react';
import { Grid, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, User, Plus } from 'lucide-react';
import PhoneMockup from './PhoneMockup';

const SocialFeedPreview = ({ brandData }) => {
  if (!brandData) return null;

  const brandColor = brandData?.colors?.accent || '#C6A96B';
  const brandName = brandData?.brandArchetype?.split(' ').slice(-1)[0] || 'Brand';
  const logoUrl = brandData?.logos?.[0]?.url || `https://placehold.co/100x100/111/${(brandColor || '#C6A96B').replace('#','')}/?text=${brandName[0]}`;

  return (
    <div className="flex flex-col gap-8 items-center lg:items-start">
      <div className="mb-4">
        <h3 className="text-3xl font-headline mb-2 text-primary font-bold text-center lg:text-left">Social Identity</h3>
        <p className="text-muted text-sm max-w-md font-medium text-center lg:text-left">See how your brand's DNA translates into a cohesive social media presence.</p>
      </div>

      <PhoneMockup>
        <div className="bg-surface text-primary h-full flex flex-col font-ui border border-accent/10 rounded-[3rem] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 pt-10 border-b border-light shrink-0 bg-surface/80 backdrop-blur-md">
            <span className="font-bold text-sm tracking-tight text-primary/80">{brandName.toLowerCase()}.official</span>
            <Plus className="w-5 h-5 text-accent" />
          </div>

          {/* Profile Section */}
          <div className="px-6 py-6 flex flex-col gap-5">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-accent/20 via-accent to-primary/20">
                <div className="w-full h-full rounded-full bg-surface p-1">
                  <img src={logoUrl} className="w-full h-full rounded-full object-cover shadow-sm" alt="Profile" />
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
                Creating a {brandData?.typography?.ui || 'premium'} world through the lens of {brandData?.colors?.accent || 'brand'} aesthetics. ✨
              </p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-accent/10 text-accent py-2 rounded-xl text-xs font-bold hover:bg-accent hover:text-secondary transition-all">Edit Profile</button>
              <button className="flex-1 bg-secondary text-primary py-2 rounded-xl text-xs font-bold border border-light hover:bg-surface transition-all">Insights</button>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex gap-4 px-6 overflow-x-hidden py-2 shrink-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div 
                  className="w-14 h-14 rounded-full border border-light flex items-center justify-center overflow-hidden bg-white shadow-sm"
                  style={{ border: `2px solid ${brandColor}33` }}
                >
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: `${brandColor}${i === 1 ? 'cc' : i === 2 ? '99' : i === 3 ? '66' : '33'}` }}></div>
                </div>
                <span className="text-[10px] font-bold text-muted">Core {i}</span>
              </div>
            ))}
          </div>

          {/* Feed Tabs */}
          <div className="flex border-t border-light mt-4 shrink-0">
            <div className="flex-1 flex justify-center py-3 border-b-2 border-primary">
              <Grid className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 flex justify-center py-3 opacity-20">
              <User className="w-5 h-5 text-muted" />
            </div>
          </div>

          {/* Feed Grid */}
          <div className="grid grid-cols-3 gap-0.5 flex-1 bg-white/5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="aspect-square relative group overflow-hidden"
                style={{ backgroundColor: i % 2 === 0 ? brandColor : '#1a1a1a' }}
              >
                {i % 3 === 0 ? (
                  <div className="w-full h-full flex flex-col p-2 justify-end gap-1">
                    <div className="w-4 h-4 rounded-full bg-white/20"></div>
                    <div className="w-full h-1 bg-white/10 rounded-full"></div>
                    <div className="w-2/3 h-1 bg-white/10 rounded-full"></div>
                  </div>
                ) : (
                  <img 
                    src={`https://placehold.co/300x300/111/${brandColor.replace('#','')}/?text=${i}`} 
                    className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all" 
                    alt="" 
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </PhoneMockup>
    </div>
  );
};

export default SocialFeedPreview;
