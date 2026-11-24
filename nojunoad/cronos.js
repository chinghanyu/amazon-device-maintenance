Java.perform(function(){
  var B64=Java.use("android.util.Base64"), JStr=Java.use("java.lang.String");
  var Log=Java.use("android.util.Log");
  // Log to logcat (tag NOJUNOAD) -- unbuffered, unlike frida-inject's stdout,
  // so drops are verifiable while the injector stays resident. send() kept too.
  function mark(s){ try{ Log.i("NOJUNOAD",""+s); }catch(e){} try{ send(s); }catch(e){} }
  function layoutOf(did){
    if(did===null) return null; did=""+did;
    if(did.indexOf("hestia-layout://")===0){
      try{ var s=JStr.$new(B64.decode(did.substring(16),0)).toString();
        var m=/"layoutId":"([^"]+)"/.exec(s); return m?m[1]:null; }catch(e){ return null; }
    }
    return null;
  }
  // Coarse page category for the heartbeat tally. Uses the layoutId when the
  // dataId is a hestia-layout URI, otherwise buckets by the URI scheme so we
  // can see photo/weather/other feed rates without guessing exact names.
  function classify(did, lo){
    if(did===null) return "null";
    did=""+did;
    if(lo) return "layout:"+lo;
    var i=did.indexOf("://");
    return "scheme:"+(i>0?did.substring(0,i):did.substring(0,16));
  }

  var kept=0, dropped=0, total=0;
  var counts={};                 // category -> count seen through handleNewPage
  var lastBeat=0;
  function beat(){
    var now=Date.now();
    if(now-lastBeat<120000) return;   // at most one heartbeat / 2 min, on-thread
    lastBeat=now;
    var parts=[]; for(var k in counts){ parts.push(k+"="+counts[k]); }
    mark("HEARTBEAT total="+total+" kept="+kept+" dropped="+dropped+" | "+parts.join(" "));
  }

  var VPM=Java.use("com.amazon.paladin.pages.viewpager.ViewPagerModel");
  VPM.handleNewPage.implementation=function(egg){
    total++;
    try{
      var pdm=egg?egg.getPageDisplayModel():null;
      var did=pdm?pdm.getDataId():null;
      var lo=layoutOf(did);
      var cat=classify(did, lo);
      counts[cat]=(counts[cat]||0)+1;
      if(lo && lo.indexOf("JunoAd")>=0){
        dropped++;
        var slot="?"; try{ slot=""+pdm.getSlotPosition(); }catch(e){}
        mark("DROP JunoAd slot="+slot+" dropped="+dropped+" kept="+kept);
        try{ this.requestNextPage(); }catch(e){ mark("reqNext-err "+e); }
        beat();
        return; // do not add the ad page
      }
    }catch(e){ mark("handleNewPage-filter-err "+e); }
    kept++;
    beat();
    return this.handleNewPage(egg);
  };
  mark("HOOKED filter_v3 (drop JunoAd + per-type heartbeat)");
});
