Java.perform(function(){
  var B64=Java.use("android.util.Base64"), JStr=Java.use("java.lang.String");
  var Log=Java.use("android.util.Log");
  function mark(s){ try{ Log.i("NOJUNOAD",""+s); }catch(e){} try{ send(s); }catch(e){} }
  function layoutOf(did){
    if(did===null) return null; did=""+did;
    if(did.indexOf("hestia-layout://")===0){
      try{ var s=JStr.$new(B64.decode(did.substring(16),0)).toString();
        var m=/"layoutId":"([^"]+)"/.exec(s); return m?m[1]:null; }catch(e){ return null; }
    }
    return null;
  }
  function isAd(pdm){
    if(!pdm) return false;
    try{ var lo=layoutOf(pdm.getDataId()); if(lo && lo.indexOf("JunoAd")>=0) return true; }catch(e){}
    return false;
  }
  var kept=0, dropped=0;
  var VPM=Java.use("com.amazon.paladin.pages.viewpager.ViewPagerModel");
  VPM.handleNewPage.implementation=function(egg){
    try{
      var pdm=egg?egg.getPageDisplayModel():null;
      if(isAd(pdm)){
        dropped++;
        var slot="?"; try{ slot=""+pdm.getSlotPosition(); }catch(e){}
        mark("DROP JunoAd slot="+slot+" dropped="+dropped+" kept="+kept);
        try{ this.requestNextPage(); }catch(e){ mark("reqNext-err "+e); }
        return; // do not add the ad page
      }
    }catch(e){ mark("handleNewPage-filter-err "+e); }
    kept++;
    return this.handleNewPage(egg);
  };
  mark("HOOKED filter_v2 (drop JunoAd at handleNewPage)");
});
