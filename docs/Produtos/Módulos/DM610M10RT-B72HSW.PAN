PVObject_=pvModule
  Version=7.4.5
  Flags=$00908043

  PVObject_Commercial=pvCommercial
    Comment=www.dmegcsolar.com  (China)
    Flags=$0041
    Manufacturer=DMEGC
    Model=DM610M10RT-B72HSW
    DataSource=Manufacturer
    YearBeg=2024
    Width=1.134
    Height=2.384
    Depth=0.030
    Weight=32.800
    NPieces=100
    PriceDate=24/08/23 14:38
    Remarks, Count=5
      Str_1=框架: anodized alu
      Str_2=结构:2.0 mm tempered
      Str_3=连接: TUV
      Str_4
      Str_5
    End of Remarks
  End of PVObject pvCommercial

  Technol=mtSiMono
  NCelS=72
  NCelP=2
  NDiode=3
  SubModuleLayout=slTwinHalfCells
  FrontSurface=fsARCoating
  GRef=1000
  TRef=25.0
  PNom=610.0
  PNomTolLow=0.00
  PNomTolUp=3.00
  BifacialityFactor=0.788
  Isc=14.320
  Voc=53.97
  Imp=13.420
  Vmp=45.49
  muISC=6.74
  muVocSpec=-133.0
  muPmpReq=-0.290
  RShunt=900
  Rp_0=22000
  Rp_Exp=5.50
  RSerie=0.220
  Gamma=1.060
  muGamma=-0.0004
  VMaxIEC=1500
  VMaxUL=1500
  Absorb=0.90
  ARev=3.200
  BRev=16.308
  RDiode=0.010
  VRevDiode=-0.70
  AirMassRef=1.500
  CellWidth=0.182
  CellHeight=0.092
  LIDLoss=1.00
  SandiaAMCorr=50.000
  RelEffic800=0.50
  RelEffic600=0.54
  RelEffic400=0.44
  RelEffic200=-1.34

  PVObject_IAM=pvIAM
    Flags=$00
    IAMMode=UserProfile
    IAMProfile=TCubicProfile
      NPtsMax=9
      NPtsEff=9
      LastCompile=$B18D
      Mode=3
      Point_1=0.0,1.00000
      Point_2=30.0,1.00000
      Point_3=50.0,1.00000
      Point_4=60.0,1.00000
      Point_5=70.0,0.99000
      Point_6=75.0,0.98000
      Point_7=80.0,0.91000
      Point_8=85.0,0.80000
      Point_9=90.0,0.00000
    End of TCubicProfile
  End of PVObject pvIAM

  OperPoints, list of=5 tOperPoint
    Point_1=True,1000,25.0,0.00,51.90,13.810,13.060,43.28,565.24
    Point_2=False,800,25.0,0.50,0.00,0.000,0.000,0.00,454.53
    Point_3=False,600,25.0,0.54,0.00,0.000,0.000,0.00,341.04
    Point_4=False,400,25.0,0.44,0.00,0.000,0.000,0.00,227.13
    Point_5=False,200,25.0,-1.34,0.00,0.000,0.000,0.00,111.55
  End of List OperPoints
End of PVObject pvModule
